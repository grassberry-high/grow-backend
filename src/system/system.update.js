'use strict';
const CRONJOB_LICENSE_PATTERN = '0 0 0 * * *';

const debugSystem = require('debug')('system');


const async = require('async');
const moment = require('moment');

const {logger} = require('../_logger/logger.js');

const {SystemModel} = require('./system.model');

const {CronJob} = require('cron');
const {EventModel} = require('../data-logger/event.model');

const {SensorDataModel} = require('../data-logger/sensor-data.model');

const {ServerLogModel} = require('../_logger/server-log.model');

const {SessionModel} = require('../system/session.model');

const {ChamberModel} = require('../chamber/chamber.model');

const {CronjobModel} = require('../cronjob/cronjob.model');

const {RuleModel} = require('../rule/rule.model');


const {getSerial} = require('../shell/shell.service.js');
const {emit} = require('../_api/rest.helper.js');
const apiEndpointsModule = require('../_api/api-endpoints.js');

const apiEndpoints = apiEndpointsModule();
const {bootSensorsAndRelays} = require('../_helper/ouputAndSensorBoot.helper.js');

// --------------------------- Cronjobs -----------------------------
const bootLicenseCronjob = () => {
  new CronJob(CRONJOB_LICENSE_PATTERN,
    () => {
      const options = {};
      getLicenseInformation(options, (err) => {
        if (err) {
          logger.error(err);
        }
      });
    },
    () => {
    },
    // console.log 'cron xyz'
    true,
    'Europe/Amsterdam'// http://momentjs.com/timezone/ #TODO TIMEZONE & LANGUAGE SETTING
  );
};

// --------------------------- License -----------------------------
const getLicenseInformation = (options, callback) =>
  async.waterfall([
    (next) => getSerial(next),
    (serial, next) => {
      if (serial === 'MAC OSX') {
        return next(null, 'MAC OSX', {payload: {validTill: moment().add('1', 'hours').toISOString()}});
      }
      const method = 'GET';
      const url = `${apiEndpoints['licenses']}/${encodeURIComponent(serial)}`;
      const data = {};
      debugSystem(`getting license for serial ${serial} from ${url}`);
      emit(method, url, data, (err, license) => next(err, serial, license));
    },
    (serial, license, next) => {
      debugSystem('License', license);
      if (!license.payload || !license.payload.enabledFeatures) {
        return next();
      }
      SystemModel.findOneAndUpdate({}, {
        enabledFeatures: license.payload.enabledFeatures,
        serial,
        lastConnect: moment(),
      }, {upsert: true}).exec(next);
    },
  ], (err) => callback(err))
;

// --------------------------- Settings Updates -----------------------------
const updateSystem = (appUser, data, options, callback) => {
  // sanitize
  let key;
  const allowedUpdates = ['region', 'timeZone', 'units', 'wifi'];
  for (key in data) {
    if (allowedUpdates.indexOf(key) === -1) {
      delete data[key];
    }
  }

  SystemModel.findOne({}).exec((err, system) => {
    if (err) {
      return callback(err);
    }
    if (!system) {
      system = new SystemModel();
    }
    system = Object.assign(system, data);
    system.save((err, system) => {
      if (err) {
        return callback(err);
      }
      const bootOptions = {noCrons: true};
      bootSensorsAndRelays(bootOptions, (err) => callback(err, system));
    });
  });
};

const reset = (callback) =>
  // TODO: this just deletes the db data, better would be to reseed
  async.parallel({
    chamber(next) {
      ChamberModel.remove({}).exec(next);
    },
    cronjobs(next) {
      CronjobModel.remove({}).exec(next);
    },
    rules(next) {
      RuleModel.remove({}).exec(next);
    },
    events(next) {
      EventModel.remove({}).exec(next);
    },
    sensorData(next) {
      SensorDataModel.remove({}).exec(next);
    },
    serverLogs(next) {
      ServerLogModel.remove({}).exec(next);
    },
    sessions(next) {
      SessionModel.remove({}).exec(next);
    },
  }, (err) => callback(err));
module.exports = {bootLicenseCronjob, getLicenseInformation, updateSystem, reset};
