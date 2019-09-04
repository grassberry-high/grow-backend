'use strict';
const HISTORY_LENGTH = 30;

const moment = require('moment');
const async = require('async');
const debug = require('debug');

const debugCO2 = debug('sensor:co2');

const SensorMock = require('./sensor.class.mock.js');

const {logger} = require('../../_logger/logger.js');

const simulation = {
  co2: require('./simulation/co2-simulation.json'),
};

/**
 * Mock of the MHZ16 co2 sensor.
 */
class MHZ16SensorMock extends SensorMock { // co2
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    debugCO2(`CO2 sensor mock ${options._id}`);
    async.series([
      (next) => super(options, next),
      (next) => {
        this.simulationCounter = HISTORY_LENGTH;
        async.eachSeries(this.detectors,
          (detector, next) => {
            detector.round = true;
            detector.min = 550;
            detector.max = 2000;
            detector.change = 1;
            this.seedSensor(detector, HISTORY_LENGTH, simulation[detector.type], () =>
              MHZ16SensorMock.boot((err) => {
                if (err) {
                  return next(err);
                }
                this.readSensor();
                return next();
              })
            );
          },
          next(null, this));
      }], (err) => {
      return callback(err, this);
    });
  }

  /**
   * boot mhz16 sensor
   * @param {*} callback
   * @return {*}
   */
  static boot(callback) {
    return callback();
  }

  /**
   * read co2 value
   */
  readSensor() {
    const self = this;
    this.simulationCounter++;
    if (this.simulationCounter > 999) {
      this.simulationCounter = 0;
    }
    async.eachSeries(this.detectors,
      (detector, next) => {
        if (detector.type === 'co2') {
          const co2 = simulation.co2[self.simulationCounter];
          debugCO2(`CO2: PPM  ${co2} (adr ${self.address}) ${moment().format('hh:mm:ss DD-MM-YYYY')}`);
          self.processSensorValue(detector, co2, next);
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
  }
}
module.exports = MHZ16SensorMock;
