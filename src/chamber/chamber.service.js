'use strict';
const debug = require('debug');

const debugChamber = debug('chamber');
const debugChamberSetup = debug('chamber:setup');

const mongoose = require('mongoose');
const async = require('async');
const moment = require('moment');
const {uniqBy, omit, cloneDeep} = require('lodash');

const {ChamberModel} = require('./chamber.model');
const {RuleModel} = require('../rule/rule.model');

const {sensorRegistered} = require('../sensor/sensor.service.js');
const {getRelayState} = require('../relay/relay.service.js');
const {upsertCronjob} = require('../cronjob/cronjob.service.js');
const {upsertRule} = require('../rule/rule.service.js');
const {bootSensorsAndRelays} = require('../_helper/ouputAndSensorBoot.helper.js');

// #sensor id was populated and needs now to be split for diff. devices
// mapDevicesToRules = (chambers)->
//   for chamber in chambers
//     if chamber.rules?
//       for rule in chamber.rules
//         rule.sensor.detectors = rule.sensor.detectors.filter((detector)-> rule.forDetector == detector.type)[0]
//         for key, value of rule.sensor.detectors
//           rule.sensor[key] = value
//         delete rule.sensor.detectors

exports.addListOfActiveSensors = (chambers) => {
  chambers.forEach((chamber) => {
    chamber.activeSensors = [];
    if (chamber.rules) {
      chamber.rules.forEach((rule) => {
        chamber.activeSensors.push(rule.sensor);
      });
    }
    if (chamber.displays) {
      chamber.displays.forEach((display) => {
        chamber.activeSensors.push(display);
      });
    }

    if (chamber.activeSensors) {
      chamber.activeSensors = uniqBy(chamber.activeSensors, '_id');
      chamber.activeSensors = chamber.activeSensors.filter((activeSensor) => {
        if (!activeSensor || !activeSensor.address) {
          return false;
        }
        return sensorRegistered(activeSensor.address);
      });
    }
    debugChamber('activeSensors', chamber.activeSensors);
  });
  return chambers;
};

exports.addListOfRelays = (chambers) => {
  chambers.forEach((chamber) => {
    chamber.allRelays = [];
    if (chamber.rules) {
      chamber.rules = chamber.rules.map((rule) => {
        if (rule.relay && rule.relay._id) {
          const currentState = getRelayState(rule.relay._id);
          chamber.allRelays.push({
            _id: rule.relay._id,
            name: rule.relay.name || rule.relay.label,
            device: rule.device,
            state: currentState,
          });
          rule.relay = rule.relay._id; // depopulate
          return rule;
        }
      });
    }
    if (chamber.allRelays) {
      chamber.allRelays = uniqBy(chamber.allRelays, '_id');
    }
    debugChamber('allRelays', chamber.allRelays);
  });
  return chambers;
};


exports.getChambers = (options, callback) => {
  const Query = ChamberModel.find({});
  if (options.populate && options.populate.all != null) {
    Query.populate([{path: 'displays'}]).deepPopulate(['rules', 'rules.sensor', 'rules.relay']);
  }
  if (options.lean != null) {
    Query.lean();
  }

  Query.exec((err, chambersFound) => {
    if (err) {
      return callback(err);
    }
    if (!chambersFound) {
      return callback(null, []);
    }
    debugChamber('chambersFound', chambersFound);
    this.addListOfActiveSensors(chambersFound);
    this.addListOfRelays(chambersFound);
    return callback(null, chambersFound);
  });
};

exports.addRules = (rules, callback) => {
  if (!rules) {
    return callback();
  }
  const rulesIds = [];
  async.eachSeries(rules,
    (ruleToUpsert, next) => {
      ruleToUpsert = new RuleModel(ruleToUpsert);
      delete ruleToUpsert.__v;
      debugChamberSetup('\nruleToUpsert: before', ruleToUpsert);
      if (ruleToUpsert.onValue != null) {
        ruleToUpsert.onValue = parseFloat(ruleToUpsert.onValue);
      }
      if (ruleToUpsert.offValue != null) {
        ruleToUpsert.offValue = parseFloat(ruleToUpsert.offValue);
      }
      if (ruleToUpsert.relay && ruleToUpsert.relay._id) {
        ruleToUpsert.relay = ruleToUpsert.relay._id;
      }
      if (ruleToUpsert.sensor && ruleToUpsert.sensor._id) {
        ruleToUpsert.sensor = ruleToUpsert.sensor._id;
      }

      debugChamberSetup('Adding cronjobs');
      this.addCronjobs(ruleToUpsert, (err, cronjobIds) => {

        if (err) {
          return next(err);
        }
        ruleToUpsert.cronjobs = cronjobIds;
        debugChamberSetup('ruleToUpsert: after', ruleToUpsert);
        upsertRule(ruleToUpsert, (err, upsertedRule) => {
          if (err) {
            return next(err);
          }
          rulesIds.push(upsertedRule._id);
          return next(null);
        });
      });
    },

    (err) => {
      if (err) {
        return callback(err);
      }
      return callback(err, rulesIds);
    });
};

exports.addCronjobs = (rule, callback) => {

  debugChamberSetup('\n\nrules with cronjobs', rule);
  const cronjobs = [];

  if (rule.trigger === 'timeOnOff') {
    const onPattern = [moment(rule.startTime).seconds(), moment(rule.startTime).minutes(), moment(rule.startTime).hours(), '*', '*', '*'].join(' ');
    debugChamberSetup('rule.durationHOn', rule.durationHOn, ` ${moment(rule.startTime).add(rule.durationHOn, 'hours').hours()} ${moment(rule.startTime).hours()}`);
    const offPattern = [moment(rule.startTime).seconds(), moment(rule.startTime).minutes(), moment(rule.startTime).add(rule.durationHOn, 'hours').hours(), '*', '*', '*'].join(' ');
    cronjobs.push({ruleId: rule._id, relay: rule.relay, action: 'switchOn', cronPattern: onPattern});
    cronjobs.push({ruleId: rule._id, relay: rule.relay, action: 'switchOff', cronPattern: offPattern});
  } else if (rule.trigger === 'interval' && rule.onPattern) {
    cronjobs.push({ruleId: rule._id, relay: rule.relay, action: 'switchOn', cronPattern: rule.onPattern});
  } else {
    return callback(null, []);
  }

  debugChamberSetup('Prepared cronjobs for saving', cronjobs);
  const cronjobIds = [];
  async.each(cronjobs,
    (cronjob, next) =>
      upsertCronjob(cronjob, (err, newCronjob) => {
        if (err) {
          return next(err);
        }
        debugChamberSetup('Added cronjob', newCronjob);
        cronjobIds.push(newCronjob._id);
        return next();
      })
    ,
    (err) => {
      if (err) {
        return callback(err);
      }
      return callback(err, cronjobIds);
    });
};

exports.spliceRule = (chamberId, ruleId, callback) => ChamberModel.update({_id: chamberId}, {$pullAll: {rules: [ruleId]}}).exec(callback);

exports.upsertChamber = (chamberToUpsert, callback) => {
  debugChamberSetup('chamberToUpsert', chamberToUpsert);
  delete chamberToUpsert.__v;

  // TODO: specific check for cycle in valdiator
  //    if chamberToUpsert.cycle == "drying"
  //      rules = rules.filter (rule)->
  //        return rule.forDetector != 'water'
  //
  //  if chamberToUpsert.light?
  //    return callback "No light relay selected (only allowed with drying mode)" if !chamberToUpsert.light.relay?._id?
  //    light = JSON.parse JSON.stringify chamberToUpsert.light
  //    chamberToUpsert.light.relay = chamberToUpsert.light.relay._id

  if (chamberToUpsert.strains) {
    chamberToUpsert.strains = chamberToUpsert.strains.filter((strain) => (strain && strain.name));
  }

  async.series([
    (next) => { // save rules
      if (!chamberToUpsert.rules) {
        debugChamberSetup('Chamber without rules', chamberToUpsert.rules);
        return next(null);
      }
      this.addRules(chamberToUpsert.rules, next);
    },
  ], (err, results) => {
    if (err) {
      debugChamberSetup('upsertedChamberErr', err);
      return callback(err);
    }
    chamberToUpsert.rules = results[0];
    if (!chamberToUpsert._id) {
      chamberToUpsert._id = new mongoose.mongo.ObjectID();
    }
    ChamberModel.findOneAndUpdate({_id: chamberToUpsert._id}, omit(chamberToUpsert, '_id'), {
      'upsert': true,
      'new': true,
      'lean': true,
    }).exec((err, upsertedChamber) => {
      if (err) {
        debugChamberSetup('upsertedChamberErr', err);
        return callback(err);
      }
      debugChamberSetup('upsertedChamber', upsertedChamber);
      const bootOptions = {};
      bootSensorsAndRelays(bootOptions, () => {
      });
      debugger;
      return callback(null, upsertedChamber);
    });
  });
}
;
