'use strict';
const {inspect} = require('util');
const chalk = require('chalk');
const debug = require('debug');

const debugRelay = debug('relay');

const mongoose = require('mongoose');
const moment = require('moment');
const {findIndex, omit} = require('lodash');

const Relay = require('./relay.class.js');
const {RelayModel} = require('./relay.model');

const RelayController = require('./relay-controller/relay-controller.class');
const RelayControllerMock = require('./relay-controller/mocks/relay-controller.class.mock');

const relaySeeds = require('./seed/relays.seed');
const {adressInActiveDevices} = require('../i2c/i2c.js');

let relays = [];

/**
 * Boot relays
 * @param {object} options
 * @param {*} callback
 */
exports.bootRelays = (options, callback) => {
  let relayController;
  if (process.env.SIMULATION === 'true') {
    relayController = new RelayControllerMock();
  } else {
    relayController = new RelayController();
  }
  if (options.additive !== true) {
    relays = [];
  }
  RelayModel.find({}).lean().exec((err, relaysFound) => {
    if (err) {
      return callback(err);
    }
    if ((!relaysFound) || (relaysFound.length === 0)) {
      return callback('No relays found');
    }
    if (adressInActiveDevices(relayController.address)) {
      // if not already in stack
      relaysFound.forEach((relay) => {
        relay.relayController = relayController;
        const newRelay = new Relay(relay);
        if (!~findIndex(relays, {'address': newRelay.address})) {
          relays.push(newRelay);
        }
      });
    }
    debugRelay(`booted ${relays.length} relays, ${relaysFound.length} are not active`);
    return callback();
  });
};

/**
 * Get full relay by relay id
 * @param {object} id: id of the relay
 * @param {*} callback: fn(err, relay)
 * @return {*}
 */
exports.getRelayById = (id, callback) => {
  const index = findIndex(relays, (relay) => relay._id.toString() === id.toString());
  if (index === -1) {
    return callback('No ouptut with this ID');
  } else {
    return callback(null, relays[index]);
  }
};

/**
 * Return active relays
 * @return {Array}
 */
const getActiveRelays = () => {
  return relays;
};

/**
 * Get the relay state by relay id
 * @param {object} id
 * @return {*}
 */
exports.getRelayState = (id) => {
  const selectedRelay = relays.filter((relay) => relay._id.toString() === id.toString());
  if (selectedRelay.length === 0) {
    return null;
  }
  return selectedRelay[0].state || 0;
};

/**
 * get relays
 * @param {object} options: filter
 * @param {*} callback
 * @return {*}
 */
exports.getRelays = (options, callback) => {
  if (options.filter && options.filter._id) {
    relays.forEach((relay) => {
      if (relay._id.toString() === options.filter._id) {
        return callback(null, [relay]);
      }
    });
  }
  return callback(null, relays);
};

/**
 * Rename relay
 * @param {object} _id: DB _id of the relay
 * @param {string} name: new relay name
 * @param {*} callback: fn(err, success)
 * @return {*}
 */
exports.renameRelay = (_id, name, callback) =>
  RelayModel.findOneAndUpdate({_id}, {$set: {name}}).exec((err) => {
    if (err) {
      return callback(err);
    }
    const index = findIndex(relays, (relay) => relay._id.toString() === _id);
    if (index !== -1) {
      relays[index].name = name;
    }
    console.log(chalk.bgMagenta(`${index}`, inspect(relays[index])));
    return callback(null, true);
  });

/**
 * Upsert a new relay
 * @param {object} relayToUpsert: relay to upsert
 * @param {*} callback: fn(err, success)
 */
exports.upsertRelay = (relayToUpsert, callback) => {
  if (!relayToUpsert._id) {
    relayToUpsert._id = new mongoose.mongo.ObjectID();
  }
  delete relayToUpsert.__v;
  RelayModel.findOneAndUpdate({_id: relayToUpsert._id}, omit(relayToUpsert, '_id'), {
    'upsert': true,
    'new': true,
  }).exec((err, relayToUpsert) => {
    if (err) {
      return callback(err);
    }
    this.bootRelays({}, () => callback(null, relayToUpsert));
  });
};

/**
 *
 * @param {*} callback
 * @return {*}
 */
exports.broadcastRelays = (callback) => {
  relays.forEach((relay) => {
    relay.broadcastRelay();
  });
  return callback(null, true);
};

/**
 * Operate a relay
 * @param {object} relayId
 * @param {string} operation: 'switchOn', 'switchOff'
 * @param {string} info
 * @param {object} detectorId
 * @param {*} callback
 * @return {*}
 */
exports.operateRelay = (relayId, operation, info, detectorId, callback) => {
  if (!['switchOn', 'switchOff'].some((allowedOperations) => allowedOperations === operation)) {
    return callback('Invalid operation');
  }
  this.getRelayById(relayId, (err, relay) => {
    if (err) {
      return callback(err);
    }
    debugRelay('relay', relay);
    if ((!relay)) {
      return callback(err);
    }
    relay[operation](info, detectorId, callback);
  });
};

/**
 * Block a relay for a certain time
 * @param {object} relayId
 * @param {object} blockedTill
 * @param {*} callback
 * @return {*}
 */
exports.blockRelay = (relayId, blockedTill, callback) =>
  this.getRelayById(relayId, (err, relay) => {
    if (err) {
      return callback(err);
    }
    relay.blockedTill = moment().add(blockedTill, 'minutes');
    debugRelay(`${relay.device} ${relayId} is blocked till ${relay.blockedTill.format('HH:mm DD.MM.YYYY')}`);
    return callback(null, relay);
  });

/**
 * Seed relays
 * @param {*} callback: fn(err)
 */
exports.seedRelays = (callback) => {
  RelayModel.countDocuments({}, (err, count) => {
    if (err) {
      return callback(err);
    }
    if (count > 0) {
      return callback(null);
    }
    RelayModel.insertMany(relaySeeds, callback);
  });
};
