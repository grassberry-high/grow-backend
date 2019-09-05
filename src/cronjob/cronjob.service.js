'use strict';
const debug = require('debug');

const debugCronjobs = debug('cronjobs');
const debugBoot = debug('boot');
const debugCronjobsTime = debug('cronjobs:time');

const moment = require('moment');

const {CronJob} = require('cron');
const {CronjobModel} = require('./cronjob.model');


const {getLocalTime} = require('../_helper/conversion.helper.js');
const {logger} = require('../_logger/logger.js');

const {operateRelay} = require('../relay/relay.service');

const cronjobs = [];
let cronTime;

/**
 * Get time from cronjob time
 * @param {string} cronTime
 * @return {*|moment.Moment}
 */
exports.getTimeFromCronjob = (cronTime) => {
  cronTime = cronTime.split(' ').splice(0, 3).reverse().join(':');
  return moment(cronTime, 'hh:mm:ss', 'en');
};

/**
 * Check if time is after current time
 * @param {object} isotime
 * @return {boolean}
 */
exports.afterCurrentTime = (isotime) => {
  if ((!isotime) || (typeof isotime.format !== 'function')) {
    logger.error(`wasn't able to project time: ${isotime}`);
    return false;
  }
  const timeProjected = moment(isotime.format('HH:mm:ss'), 'HH:mm:ss');
  debugCronjobsTime(`Projected time: ${timeProjected.toISOString()} diff: ${moment().diff(timeProjected, 'seconds')} curr:${moment().format('HH:mm:ss')}`);
  return moment().diff(timeProjected, 'seconds') > 0; // current time exceeded cronjob time
};

/**
 * Get the device status (on/off) at time of boot fromm cronjob times
 * @param {object[]} cronjobs
 */
exports.bootStatus = (cronjobs) => {
  // always two cronjobs per light in a chamber on & off
  const grouped = {};
  cronjobs.forEach((cronjob) => {
    if (!grouped[cronjob.relay._id]) {
      grouped[cronjob.relay._id] = {};
    }
    grouped[cronjob.relay._id][cronjob.action] = this.getTimeFromCronjob(cronjob.cronPattern);
  });
  debugBoot(`Launching ${cronjobs.length} cronjobs on relays ${Object.keys(grouped).length} current time ${moment().toISOString()}`);
  for (const relayId in grouped) {
    if (Object.prototype.hasOwnProperty.call(grouped, relayId)) {
      let action = null;
      if ((grouped[relayId].switchOff != null) && (grouped[relayId].switchOn != null)) {
        // on is before off trigger, on time is reached, off not: |OFF|ON*|OFF* or |ON*|OFF*|
        const offGreaterOn = grouped[relayId].switchOff.diff(grouped[relayId].switchOn, 'seconds') > 0;
        if (offGreaterOn && this.afterCurrentTime(grouped[relayId].switchOn) && !this.afterCurrentTime(grouped[relayId].switchOff)) {
          debugBoot(`Switching on/off, on: ${grouped[relayId].switchOn.format('HH:mm')}, off: ${grouped[relayId].switchOff.format('HH:mm')} `);
          debugBoot(`Off after on ${offGreaterOn} on;`);
          debugBoot(`On is after current ${this.afterCurrentTime(grouped[relayId].switchOn)}`);
          debugBoot(`Off is after current ${!this.afterCurrentTime(grouped[relayId].switchOff)}`);
          action = 'switchOn';
          // off is before on trigger, on time is reached, off not: |ON|OFF*|ON* or OFF*|ON*
        } else if (!offGreaterOn && this.afterCurrentTime(grouped[relayId].switchOn)) {
          debugBoot(`Switching on/off, off: ${grouped[relayId].switchOff.format('HH:mm')} on: ${grouped[relayId].switchOn.format('HH:mm')}`);
          debugBoot(`Off before on ${grouped[relayId].switchOff.diff(grouped[relayId].switchOn, 'seconds') < 0}`);
          debugBoot(`On is after current: ${this.afterCurrentTime(grouped[relayId].switchOn)}`);
          action = 'switchOn';
        } else {
          action = 'switchOff';
        }
      } else if (grouped[relayId].switchOn != null) {
        action = 'switchOn';
      } else if (grouped[relayId].switchOff != null) {
        action = 'switchOff';
      }
      if (action) {
        debugCronjobs(`Bootcronjob triggers ${relayId} command ${action}`);
        const info = `Due to boot ${getLocalTime('DD.MM HH:mm:ss')}`;
        operateRelay(relayId, action, info, null, (err) => {
          if (err) {
            return logger.error(err);
          }
        });
      }
    }
  }
};

/**
 * Get the cronjob fn
 * @param {object} cronjob
 * @return {function(): *}
 */
exports.getCronFunction = (cronjob) => {
  debugCronjobs(`Creating cron function ${cronjob.relay}, ${cronjob.cronPattern} ${cronjob.action}`);
  return () => {
    const info = `Due to cronjob ${getLocalTime('DD.MM HH:mm:ss')}`;
    debugCronjobs(`triggered cronjob ${cronjob.relay}, ${cronjob.cronPattern} ${cronjob.action}`);
    operateRelay(cronjob.relay._id, cronjob.action, info, null, (err) => {
      if (err) {
        return logger.error(err);
      }
    });
  };
};

/**
 * Launch all cronjobs
 * @param {*} callback
 * @return {*}
 */
exports.launchCronjobs = (callback) =>
  CronjobModel.find({}).populate('relay', {}).exec((err, cronjobsFound) => {
    if (err) {
      return callback(err);
    }
    debugBoot(`Found ${cronjobsFound.length}`);
    this.bootStatus(cronjobsFound);
    cronjobsFound.forEach((cronjob) => {
      debugCronjobs(`Launching for relay ${cronjob.relay}, ${cronjob.cronPattern} ${cronjob.action}`);
      const newCronjob = new CronJob(cronjob.cronPattern,
        this.getCronFunction(cronjob),
        () => {
          return debugCronjobs(`stopped Cronjob ${newCronjob}`);
        },
        true
      );
      cronjobs.push(newCronjob);
    });
    return callback(null, true);
  });

/**
 * stop all cronjobs
 */
exports.stopCronjobs = () => {
  for (let index = cronjobs.length - 1; index >= 0; index--) {
    cronjobs[index].stop();
    cronjobs.splice(index, 1);
  }
};

/**
 * Get currently active cronjobs
 * @return {Array}
 */
exports.getActiveCronjobs = () => cronjobs;

/**
 * Save a cronjob in the db
 * @param {object} cronjob
 * @param {*} callback
 * @return {*}
 */
exports.createCronjob = (cronjob, callback) => {
  const newCronjob = new CronjobModel(cronjob);
  return newCronjob.save(callback);
};

/**
 * Upsert a cronjob in the DB
 * @param {object} cronjob
 * @param {*} callback
 * @return {*}
 */
exports.upsertCronjob = (cronjob, callback) => {
  cronjob = new CronjobModel(cronjob);
  const filter = {
    $or: [
      {_id: cronjob._id},
      {
        ruleId: cronjob.ruleId,
        action: cronjob.action, // to overwrite only one cronjob on/off
      },
    ],
  };
  CronjobModel.findOneAndUpdate(filter, cronjob, {
    upsert: true,
    new: true,
  }, callback);
};


/**
 * Remove a cronjob from the DB
 * @param {string[]} ids
 * @param {*} callback
 * @return {*}
 */
exports.removeCronjobs = (ids, callback) => CronjobModel.remove({_id: {$in: ids}}).exec(callback);
