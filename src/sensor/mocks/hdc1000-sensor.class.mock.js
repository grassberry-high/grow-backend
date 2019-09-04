'use strict';
const HISTORY_LENGTH = 30;

const moment = require('moment');
const async = require('async');
const debug = require('debug');

const debugTemp = debug('sensor:temp');
const debugHumidity = debug('sensor:humidity');

const SensorMock = require('./sensor.class.mock.js');
const {logger} = require('../../_logger/logger.js');

const simulation = {
  temperature: require('./simulation/temperature-simulation.json'),
  humidity: require('./simulation/humidity-simulation.json'),
};

/**
 * Mock of the HDC1000 temperature/humidity sensor.
 */
class HDC1000SensorMock extends SensorMock { // temperature/humidity
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    async.series([
      (next) => super(options, next),
      (next) => {
        debugTemp(`Temp/Humdity sensor mock ${options._id}`);
        this.simulationCounter = HISTORY_LENGTH;
        async.eachSeries(this.detectors,
          (detector, next) => {
            switch (detector.type) {
              case 'temperature':
                detector.min = 20;
                detector.max = 40;
                break;
              case 'humidity':
                detector.min = 50;
                detector.max = 80;
                break;
            }
            detector.change = 100;
            this.seedSensor(detector, HISTORY_LENGTH, simulation[detector.type], () =>
              HDC1000SensorMock.boot((err) => {
                if (err) {
                  return next(err);
                }
                this.readSensor();
                return next();
              })
            );
          },
          next(null, this));
      },
    ], (err) => {
      return callback(err, this);
    });
  }

  /**
   * Boots the sensor
   * @param {*} callback
   * @return {*}
   */
  static boot(callback) {
    return callback();
  }

  /**
   * read sensor hum/temp values
   */
  readSensor() {
    this.simulationCounter++;
    if (this.simulationCounter >= 999) {
      this.simulationCounter = 0;
    }
    async.eachSeries(this.detectors,
      (detector, next) => {
        switch (detector.type) {
          case 'temperature':
            const temperature = simulation.temperature[this.simulationCounter];
            debugTemp(`TEMPERATURE: ${temperature} (adr ${this.address}) ${moment().format('hh:mm:ss DD-MM-YYYY')}`);
            this.processSensorValue(detector, temperature, next);
            break;
          case 'humidity':
            const humidity = simulation.humidity[this.simulationCounter];
            debugHumidity(`HUMIDITY: ${humidity} (adr ${this.address})}  ${moment().format('hh:mm:ss DD-MM-YYYY')}`);
            this.processSensorValue(detector, humidity, next);
            break;
          default:
            return next(`Detector type ${detector.type} not implemented`);
        }
      },
      (err) => {
        if (err) {
          logger.error('@hdc1000', err);
        }
        setTimeout(() => this.readSensor(), this.sensorReadIntervall);
      });
  }
}

module.exports = HDC1000SensorMock;
