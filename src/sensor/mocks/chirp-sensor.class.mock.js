'use strict';
const HISTORY_LENGTH = 30;
const WATERLEVELS = ['Dry', 'Moist', 'Wet'];

const moment = require('moment');
const async = require('async');
const debug = require('debug');

const debugSensorChrip = debug('sensor:water');

const SensorMock = require('./sensor.class.mock.js');

/**
 * Mock of the Chirp water level sensor.
 */
class ChirpSensorMock extends SensorMock {
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  // eslint-disable-next-line constructor-super
  constructor(options, callback) {
    debugSensorChrip(`Chirp sensor mock ${options._id}`);
    super(options, (err) => {
      if (err) {
        return callback(err);
      }
      async.eachSeries(this.detectors,
        (detector, next) => {
          detector.min = 1;
          detector.max = 2;
          detector.round = true;
          detector.change = 10;
          this.seedSensor(detector, HISTORY_LENGTH, null, () =>
            this.boot((err) => {
              this.readSensor();
              return next(err);
            })
          );
        },
        callback(null, this));
    });

    // async.series([
    //   (next) => super(options, next),
    //   (next) => {
    //     async.eachSeries(this.detectors,
    //       (detector, next) => {
    //         detector.min = 1;
    //         detector.max = 2;
    //         detector.round = true;
    //         detector.change = 10;
    //         this.seedSensor(detector, HISTORY_LENGTH, null, () =>
    //           this.boot((err) => {
    //             this.readSensor();
    //             return next(err);
    //           })
    //         );
    //       },
    //       next(null, this));
    //   }], callback);
  };

  /**
   * Boots the sensor
   * @param {*} callback
   */
  boot(callback) {
    setTimeout(() => callback(), 100);
  }

  /**
   * read sensor water level
   */
  readSensor() {
    const waterLevel = SensorMock.randSensorValue(this.detectors[0]);
    debugSensorChrip(`WATERLEVEL: ${WATERLEVELS[waterLevel]} ${moment().format('hh:mm:ss DD-MM-YYYY')}`);
    this.processSensorValue(this.detectors[0], waterLevel, () => {
    });
    setTimeout(() => this.readSensor(), this.sensorReadIntervall);
  }
}

module.exports = ChirpSensorMock;
