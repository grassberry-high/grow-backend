'use strict';
const Datalogger = require('../data-logger.class.js');

/**
 * Mock of data logger
 */
class DataloggerMock extends Datalogger {
  /**
   * Data logger mock constructor
   */
  constructor() {
    super();
  }

  /**
   * Builds a statistic out of existing data
   * @return {*}
   */
  buildStatistic() {
    return null;
  }

  /**
   * Creates an event
   * @param {object} relay
   * @param {string} state
   * @param {string} info
   * @param {*} callback
   * @return {*}
   */
  createEvent(relay, state, info, callback) {
    return callback();
  }

  /**
   * Read saved events
   * @param {object} filterReadEvents
   * @param {object} options
   * @param {*} callback
   * @return {*}
   */
  static readEvents(filterReadEvents, options, callback) {
    return callback();
  }

  /**
   * Save sensor data to the DB
   * @param {object} sensorId
   * @param {object} detector
   * @param {*} callback
   * @return {*}
   */
  createSensorData(sensorId, detector, callback) {
    return callback();
  }
}
module.exports = DataloggerMock;
