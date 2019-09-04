'use strict';
const debug = require('debug');
const debugSensorBoot = debug('sensor:boot');
const debugSensorBootVerbose = debug('sensor:boot:verbose');

const async = require('async');
const {findIndex} = require('lodash');

let ChirpSensor = require('./chirp-sensor.class');
let HDC1000Sensor = require('./hdc1000-sensor.class');
let MHZ16Sensor = require('./mhz-16-sensor.class');

const ChirpSensorMock = require( './mocks/chirp-sensor.class.mock');
const HDC1000SensorMock = require( './mocks/hdc1000-sensor.class.mock');
const MHZ16SensorMock = require( './mocks/mhz-16-sensor.class.mock');

if (process.env.SIMULATION === 'true') {
  ChirpSensor = ChirpSensorMock;
  HDC1000Sensor = HDC1000SensorMock;
  MHZ16Sensor = MHZ16SensorMock;
}

const {SensorModel} = require('./sensor.model');
const sensorSeeds = require('./seed/sensor.seed');
const {adressInActiveDevices} = require('../i2c/i2c.js');

let registeredSensors = [];

/**
 * Add a sensor to the registeredSensors
 * @param {object} newSensor
 * @param {*} callback
 * @return {*}
 */
const addSensor = (newSensor, callback) => {
  debugSensorBootVerbose('Adding newSensor to registered sensors', newSensor, newSensor.length);
  registeredSensors.push(newSensor);
  debugSensorBootVerbose(registeredSensors.length);
  return callback();
};

/**
 * Get all sensors
 * @param {object} filterRead
 * @param {object} options
 * @param {*} callback: fn(err, sensors)
 * @return {*}
 */
const getSensorsRaw = (filterRead, options, callback) => SensorModel.find().lean().exec(callback);

/**
 * Boot sensors
 * @param {object} options
 * @param {*} callback
 */
const bootSensors = (options, callback) => {
  const filterRead = options.filterRead || {};
  SensorModel.find(filterRead).lean().exec((err, sensorsFound) => {
    if (err) {
      return callback(err);
    }
    if (options.additive !== true) {
      registeredSensors = [];
    }
    async.eachSeries(sensorsFound,
      (sensor, next) => {
        const sensorIndex = findIndex(registeredSensors, {'address': sensor.address});
        if (!!~sensorIndex) {
          return next();
        } // if already in stack
        debugSensorBoot(`Sensor ${sensor.address} ${sensor.model} is active: ${adressInActiveDevices(sensor.address)}`);
        debugSensorBootVerbose('sensorIndex', sensorIndex, registeredSensors);
        if ((sensor.technology === 'i2c') && adressInActiveDevices(sensor.address)) {
          debugSensorBootVerbose('i2c sensor:', sensor);
          switch (sensor.model) {
            case 'chirp':
              new ChirpSensor(sensor, (err, newSensor) => {
                if (err) {
                  return next(err);
                }
                addSensor(newSensor, next);
              });
              break;
            case 'hdc1000':
              new HDC1000Sensor(sensor, (err, newSensor) => {
                if (err) {
                  return next(err);
                }
                addSensor(newSensor, next);
              });
              break;
            case 'mhz16':
              new MHZ16Sensor(sensor, (err, newSensor) => {
                if (err) {
                  return next(err);
                }
                addSensor(newSensor, next);
              });
              break;
            default:
              return next();
          }
        } else if (sensor.technology === 'ble') {
          // TODO: problem with xpc-connection
          return next();
          // switch (sensor.model) {
          //   case 'sensorTag':
          //     new SensorTagSensor(sensor, function(err, newSensor){
          //       if (err) { return next(err); }
          //       addSensor(newSensor, next);
          //     });
          //   default:
          //     return next();
          // }
        } else {
          return next();
        }
      },
      (err) => {
        debugSensorBoot(`booted ${registeredSensors.length} sensors`);
        return callback(err);
      });
  });
};

/**
 * Get registered sensors
 * @param {object} options
 * @param {*} callback:fn(err, registeredSensors)
 * @return {*}
 */
const getSensors = (options, callback) => callback(null, registeredSensors);

/**
 * Checks if a sensor is registered
 * @param {number} address: sensor address
 * @return {boolean}
 */
const sensorRegistered = (address) => {
  return !!~findIndex(registeredSensors, {'address': address});
};

/**
 * Broadcast the sensor history for each registered sensor
 * @param {*} callback
 * @return {*}
 */
const broadcastSensors = (callback) => {
  registeredSensors.forEach((sensor) => sensor.broadcastSensorHistory());
  return callback(null, true);
};

/**
 * Updates the time unit (hours, minutes, seconds)
 * @param {object} sensorId
 * @param {string} newTimeUnit
 * @param {object} options
 * @param {*} callback
 * @return {*}
 */
const updateSensorTimeUnit = (sensorId, newTimeUnit, options, callback) => {
  const errors = [];
  if (sensorId === null) {
    errors.push(new Error('SensorId is required for this operation'));
  }
  if (!newTimeUnit) {
    errors.push(new Error('Time unit is required for this operation'));
  }
  if (errors.length > 0) {
    return callback(errors);
  }
  const sensor = registeredSensors.filter((sensor) => sensor._id.toString() === sensorId);
  if (sensor.length === 1) {
    sensor[0].changeSensorTimeUnit(newTimeUnit, callback);
  } else {
    return callback('Could not identify sensor');
  }
};

/**
 * Seed default sensors
 * @param {*} callback: fn(err)
 */
const seedSensors = (callback) => {
  SensorModel.countDocuments({}, (err, count) => {
    if (err) {
      return callback(err);
    }
    if (count > 0) {
      return callback(null);
    }
    SensorModel.insertMany(sensorSeeds, callback);
  });
};

module.exports = {getSensorsRaw, bootSensors, getSensors, sensorRegistered, broadcastSensors, updateSensorTimeUnit, seedSensors};
