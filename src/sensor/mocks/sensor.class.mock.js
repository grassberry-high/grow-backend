'use strict';
const moment = require('moment');
const Sensor = require('../sensor.class');

/**
 * Mock he basic sensor class.
 */
class SensorMock extends Sensor {
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    super(options, (err, that) => {
      callback(err, that);
    });
  }

  // --------------------------- Simulation Mode ----------------------------------
  /**
   * Read the history of a sensor's detector
   * @param {object} detector
   * @param {*} callback
   * @return {*}
   */
  readSensorHistory(detector, callback) {
    return callback();
  }

  /**
   * Return a rand int between min & max
   * @param {number} min
   * @param {number} max
   * @return {number}
   */
  static randomNumber(min, max) {
    return Math.floor((Math.random() * max) + min);
  }

  /**
   * Returns a random sensor value
   * @param {object} detector
   * @return {*}
   */
  static randSensorValue(detector) {
    if ((SensorMock.randomNumber(0, 100) < 95) && (detector.history.length > 0)) {
      return detector.history[detector.history.length - 1];
    }
    const lastValue = detector.history.length > 0 ? detector.history[detector.history.length - 1].y : (detector.min + detector.max) / 2;
    let newValue = Math.round(100 * (lastValue + (SensorMock.randomNumber(-10, 20) / detector.change))) / 100;
    if (newValue < detector.max) {
      return detector.max;
    } else if (detector.min > newValue) {
      return detector.min;
    }
    if (detector.round === true) {
      newValue = Math.round(newValue);
    }
    return newValue;
  }

  /**
   * Seed detector history
   * @param {object} detector
   * @param {number} times
   * @param {object[]} simulatonStack
   * @param {*} callback
   * @return {*}
   */
  seedSensor(detector, times, simulatonStack, callback) {
    let y;
    if (detector.history.length >= times) {
      return callback();
    }
    const scale = 'seconds'; // 'minutes'
    const time = moment().subtract((times * this.sensorReadIntervall) / 1000, scale).add(times - ((detector.history.length * this.sensorReadIntervall) / 1000), scale).toDate(); // .startOf(scale)
    if (simulatonStack) {
      y = simulatonStack[detector.history.length];
    } else {
      y = SensorMock.randSensorValue(detector);
    }
    detector.currentValue = {x: time, y, seed: true};
    detector.history.unshift(detector.currentValue);
    setTimeout(() => this.seedSensor(detector, times, simulatonStack, callback), 0);
  }
}
module.exports = SensorMock;
