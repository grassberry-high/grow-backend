'use strict';
const CMD_READ_TEMPERATURE = 0x00; // 2bytes
const CMD_READ_HUMIDITY = 0x01; // 2bytes
const SENSOR_REGISTER = 0x02;
const BOOT_CMD = 0x30; // 0x30(48)  Temperature, Humidity enabled, Resolultion = 14-bits, Heater on

const {inspect} = require('util');

const moment = require('moment');
const async = require('async');
const debug = require('debug');

const debugTemp = debug('sensor:temp');
const debugHumidity = debug('sensor:humidity');

const Sensor = require('./sensor.class.js');
const {getSystem} = require('../system/system.read.js');
const {logger} = require('../_logger/logger.js');

/**
 * HDC1000 is a temperature/humidity sensor.
 */
class HDC1000Sensor extends Sensor { // temperature/humidity
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    debugTemp(`Temp/Humdity sensor ${options._id}`);
    if (process.env.KALMAN_FILTER) {
      options.modes = options.modes || {};
      options.modes.kalman = JSON.parse(process.env.KALMAN_FILTER); //  {"R":0.1,"Q":0.1}
    }
    super(options, (err) => {
      if (err) {
        return callback(err);
      }
      const systemOptions = {};
      getSystem(systemOptions, (err, system) => {
        if (system && system.units && system.units.temperature) {
          this.temperatureMode = system.units.temperature;
        } else {
          this.temperatureMode = 'celsius';
        }

        this.boot((err) => {
          if (err) {
            return callback(err);
          }
          this.readSensor();
          return callback(null, this);
        });
      });
    });
  }

  /**
   * Boots the sensor
   * @param {*} callback
   */
  boot(callback) {
    if (this.i2c1 != null) {
      this.i2c1.writeByte(this.address, SENSOR_REGISTER, BOOT_CMD, (err) => {
        if (err) {
          console.error('@boot hdc1000 sensor', err);
          return callback(err);
        }
        callback(null);
      });
    } else {
      callback('I2c not started can\'t boot hdc1000 sensor');
    }
  }

  // --------------------------- Conversions ----------------------------------
  /**
   * Converts raw humidity sensor data to humidity value
   * @param {number} byte1
   * @param {number} byte2
   * @return {number}
   */
  static convertHumidity(byte1, byte2) {
    let humidity = (byte1 * 256) + byte2;
    humidity = (humidity / 65536.0) * 100.0;
    return humidity;
  }

  /**
   * Converts raw temperature sensor data to humidity value
   * @param {number} byte1
   * @param {number} byte2
   * @return {number}
   */
  static convertTemp(byte1, byte2) {
    const temp = (byte1 * 256) + byte2;
    const cTemp = ((temp / 65536.0) * 165.0) - 40;
    const fTemp = (cTemp * 1.8) + 32;
    return {cTemp, fTemp};
  }

  // --------------------------- Read ----------------------------------
  /**
   * Read the temperature
   * @param {*} callback
   */
  readTemperature(callback) {
    const self = this;
    async.waterfall([
      (next) =>
        self.i2c1.sendByte(self.address, CMD_READ_TEMPERATURE, (err) => setTimeout(next, 500)),
      (next) => self.i2c1.receiveByte(self.address, next),
      (byte1, next) =>
        self.i2c1.receiveByte(self.address, (err, byte2) => {
          if (err) {
            return next(err);
          }
          if (((byte1 == null) || (byte2 == null)) || ((byte1 === 0) && (byte2 === 0))) {
            return next(null);
          }
          const tempFull = HDC1000Sensor.convertTemp(byte1, byte2);
          let temp;
          if (self.temperatureMode === 'fahrenheit') {
            temp = tempFull.fTemp;
          } else {
            temp = tempFull.cTemp;
          }

          debugTemp(`TEMPERATURE: ${inspect(temp)} (adr ${self.address}) ${moment().format('hh:mm DD-MM-YYYY')} ${self.temperatureMode}`);
          return next(null, temp);
        }),

    ], callback);
  }

  /**
   * Read the humidity
   * @param {*} callback
   */
  readHumidity(callback) {
    const self = this;
    async.waterfall([
      (next) =>
        self.i2c1.sendByte(self.address, CMD_READ_HUMIDITY, (err) => setTimeout(next, 500)),
      (next) => self.i2c1.receiveByte(self.address, next),
      (byte1, next) =>
        self.i2c1.receiveByte(self.address, (err, byte2) => {
          if (err) {
            return next(err);
          }
          if ((byte1 == null) || (byte2 == null) || ((byte1 === 0) && (byte2 === 0))) {
            return next(null);
          }
          const humidity = HDC1000Sensor.convertHumidity(byte1, byte2);
          debugHumidity(`HUMIDITY: ${humidity} (adr ${self.address})}  ${moment().format('hh:mm DD-MM-YYYY')}`);
          return next(null, humidity);
        }),

    ], callback);
  }

  /**
   * Read all detectors of the sensor
   */
  readSensor() {
    const self = this;
    if (this.i2c1) {
      // console.log "READING TEMPERATURE/HUMIDITY SENSOR (adr #{self.address})"
      async.eachSeries(this.detectors,
        (detector, next) => {
          switch (detector.type) {
            case 'temperature':
              self.readTemperature((err, temperature) => {
                if (err) {
                  console.error(err);
                }
                if (!err && (temperature != null)) {
                  return self.processSensorValue(detector, temperature, next);
                }
              }); // TODO: choose dependend on user detector
              break;
            case 'humidity':
              self.readHumidity((err, humidity) => {
                if (err) {
                  console.error(err);
                }
                if (!err && (humidity != null)) {
                  return self.processSensorValue(detector, humidity, next);
                }
              }); // TODO: choose dependend on user detector
              break;
            default:
              return next(`Detector type ${detector.type} not implemented`);
          }
        },
        (err) => {
          if (err) {
            logger.error('@hdc1000', err);
          }
          setTimeout(() => self.readSensor(), self.sensorReadIntervall);
        });
    } else {
      setTimeout(() => self.readSensor(), self.sensorReadIntervall);
    }
  }
}

module.exports = HDC1000Sensor;
