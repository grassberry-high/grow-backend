'use strict';
const debug = require('debug');
const debugBoot = debug('boot');

const SCAN_INTERVALL = 1000;
const RELAIS_CONTROLLER = 32;

const async = require('async');

const {bootRelays} = require('../relay/relay.service.js');
const {bootSensors} = require('../sensor/sensor.service.js');
const {stopCronjobs, launchCronjobs} = require('../cronjob/cronjob.service.js');
const i2cService = require('../i2c/i2c.js');

let watchActive = false;

/**
 * Boot all sensors and relays
 * @param {object} options
 * @param {*} callback
 * @return {*}
 */
const bootSensorsAndRelays = (options, callback) =>
  async.parallel({
    sensors(next) {
      if (options.noSensors === true) {
        return next();
      }
      debugBoot('-->Booting Sensors<--');
      bootSensors(options, next);
    },
    relays(next) {
      if (options.noRelays === true) {
        return next();
      }
      debugBoot('-->Booting Relays<--');
      bootRelays(options, next);
    },
    cronjobs(next) {
      if (options.noCrons === true) {
        return next();
      }
      if (process.env.NO_CRONS) {
        return next();
      }
      debugBoot('-->Booting Cronjobs<--');
      stopCronjobs();
      launchCronjobs(next);
    },
  },
  (err) => {
    if (err) return callback(err);
    if (!watchActive) {
      watch();
    }
    return callback(null);
  });

const watch = () => {
  watchActive = true;
  setInterval(() => i2cService.checkDifference((err, result) => {
    if (result) {
      const {differenceAdded, differenceLost} = result;
      if (differenceAdded.length > 0) {
        const bootOptions = {noCrons: true, additive: true, filterRead: {address: {$in: differenceAdded}}, noRelays: false};
        if ((differenceLost.indexOf(RELAIS_CONTROLLER) === -1) && (differenceAdded.indexOf(RELAIS_CONTROLLER) === -1)) {
          bootOptions.noRelays = true;
        }
        bootSensorsAndRelays(bootOptions, () => {
        });
      }
    }
  }), SCAN_INTERVALL);
};

module.exports = {watch, bootSensorsAndRelays};
