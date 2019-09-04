'use strict';
const debugCO2 = require('debug')('sensor:co2');
// CMD_GET_SENSOR = [ 0xff, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79]
// CMD_CALIBRATE = [ 0xff, 0x87, 0x87, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf2 ]

const CMD_MEASURE = Buffer.from([0xff, 0x01, 0x9c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x63]);
const IOCONTROL = 0x0e << 3;
const FCR = 0x02 << 3;
const LCR = 0x03 << 3;
const DLL = 0x00 << 3;
const DLH = 0x01 << 3;
const THR = 0x00 << 3;
const RHR = 0x00 << 3;
const TxLVL = 0x08 << 3;
const RxLVL = 0x09 << 3;

const {inspect} = require('util');
const moment = require('moment');
const async = require('async');

const Sensor = require('./sensor.class');

const {toArray} = require('../_helper/type-transformer.service');
const {logger} = require('../_logger/logger.js');

/**
 * MHZ16 is a CO2 sensor.
 */
class MHZ16Sensor extends Sensor { // co2
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    debugCO2(`CO2 sensor ${options._id}`);
    if (process.env.KALMAN_FILTER) {
      options.modes = options.modes || {};
      options.modes.kalman = JSON.parse(process.env.KALMAN_FILTER); // {"R":0.1,"Q":0.1}
    }
    super(options, (err) => {
      if (err) {
        return callback(err);
      }
      this.boot((err) => {
        if (err) {
          return callback(err);
        }
        this.readSensor();
        return callback(null, this);
      });
    }
    );
  }

  /**
   * Boots the sensor
   * @param {*} callback
   * @return {*}
   */
  boot(callback) {
    const self = this;
    if (this.i2c1) {
      async.series([
        (next) =>
          setTimeout(() => {
            self.i2c1.writeByte(self.address, IOCONTROL, 0x08, (err) => {
              if (err && err.code !== 'EIO') {
                return next(err);
              }
              return next();
            });
          }, 100),
        (next) =>
          setTimeout(() => self.i2c1.writeByte(self.address, FCR, 0x07, next), 100),
        (next) =>
          setTimeout(() => self.i2c1.writeByte(self.address, LCR, 0x83, next), 100),
        (next) =>
          setTimeout(() => self.i2c1.writeByte(self.address, DLL, 0x60, next), 100),
        (next) =>
          setTimeout(() => self.i2c1.writeByte(self.address, DLH, 0x00, next), 100),
        (next) =>
          setTimeout(() => self.i2c1.writeByte(self.address, LCR, 0x03, next), 100),


      ], (err) => {
        if (err) {
          console.error('CO2 BOOT ERROR', err, err.stack, inspect(err));
        }
        return callback(err);
      });
    } else {
      return callback('I2c not started can\'t boot humidity sensor');
    }
  }

  // --------------------------- Conversions ----------------------------------
  /**
   * read co2 value
   * @param {*} response - raw co2 value
   * @return {number} ppm - co2 as parts per million
   */
  static parse(response) {
    if (response.length !== 9) {
      return null;
    }
    const checksum = response.reduce(((previousValue, currentValue) => previousValue + currentValue), 0);

    if (!((response[0] === 0xff) && (response[1] === 0x9c) && ((checksum % 256) === 0xff))) {
      return null;
    }

    return (response[2] << 24) + (response[3] << 16) + (response[4] << 8) + response[5]; // ppm
  }

  /**
   * read co2 value
   * @param {*} callback - fn(err, co2Value)
   */
  readCO2(callback) {
    const self = this;
    async.waterfall([
      (next) => self.i2c1.writeByte(self.address, FCR, 0x07, next),
      (next) =>
        self.i2c1.readByte(self.address, TxLVL, (err, response) => {
          if (response < CMD_MEASURE.length) {
            return next('TxLVL length < cmd length');
          }
          self.i2c1.writeI2cBlock(self.address, THR, CMD_MEASURE.length, CMD_MEASURE, (err) => next(err)); // writeI2cBlock: err, bytesWritten, buffer
        }),
      (next) => {
        let sensorData = Buffer.alloc(0);
        let left = 9;

        let timeoutCalled = false;
        const timeout = setTimeout(() => {
          timeoutCalled = true; // TODO: check if timeout._called is still a solution
          next('Operation timed out');
        }, 9000);

        async.whilst(() => left > 0
          , (nextWhilst) =>
            async.waterfall([
              (nextWaterfall) =>
                self.i2c1.readByte(self.address, RxLVL, (err, rxLevel) => {
                  if (err) {
                    return nextWaterfall(err);
                  }
                  if (rxLevel > left) {
                    rxLevel = left;
                  }
                  left = left - rxLevel;
                  return nextWaterfall(null, rxLevel);
                }),
              (rxLevel, nextWaterfall) => {
                if (rxLevel === 0) {
                  return setTimeout(() => nextWaterfall()
                    , 200);
                } else {
                  const receivedData = Buffer.alloc(rxLevel);
                  self.i2c1.readI2cBlock(self.address, RHR, rxLevel, receivedData, (err) => {
                    if (err) {
                      return nextWaterfall(err);
                    }
                    // console.log "old len #{sensorData.length} #{receivedData.length} left #{left}"
                    sensorData = Buffer.concat([sensorData, receivedData]);
                    if (err) {
                      return nextWaterfall(err);
                    }
                    return nextWaterfall();
                  });
                }
              },
            ], nextWhilst)

          , (err) => {
            clearTimeout(timeout);
            if (timeoutCalled !== true) {
              if (err) {
                return next(err);
              }
              return next(null, sensorData);
            }
          });
      },

    ], (err, sensorData) => {
      if (err) {
        return callback(err);
      }
      if (sensorData != null) {
        // console.log "sensorData", sensorData.toString('hex')
        sensorData = toArray(sensorData);
        const ppm = MHZ16Sensor.parse(sensorData);
        debugCO2(`CO2: PPM  ${ppm} (adr ${self.address}) ${moment().format('hh:mm DD-MM-YYYY')}`);
        return callback(null, ppm);
      }
    });
  }

  /**
   * read and process co2 value
   */
  readSensor() {
    const self = this;
    if (this.i2c1) {
      async.eachSeries(this.detectors,
        (detector, next) => {
          if (detector.type === 'co2') {
            self.readCO2((err, co2) => {
              if (err) {
                console.error('CO2 READ ERROR', err);
              }
              if (co2) {
                return self.processSensorValue(detector, co2, next);
              }
            });
          } else {
            return next('Detector type not implemented');
          }
        },
        (err) => {
          if (err) {
            console.error('CO2 err', err);
          }
          if (err) {
            logger.error(err);
          }
          setTimeout(() => self.readSensor(), self.sensorReadIntervall);
        });
    } else {
      setTimeout(() => self.readSensor(), self.sensorReadIntervall);
    }
  }
}

module.exports = MHZ16Sensor;
