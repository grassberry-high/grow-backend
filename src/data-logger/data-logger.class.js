'use strict';
const debugDataLogger = require('debug')('dataLogger');
const STATISTIC_INTERVALL = 48 * 60 * 60 * 1000;

const moment = require('moment');

const {SensorDataModel} = require('./sensor-data.model');
const {EventModel} = require('./event.model');

const {sendMessage} = require('../_socket-io/socket-io-messenger');
const {logger} = require('../_logger/logger.js');

/**
 * Logs sensor data
 */
class DataLogger {
  /**
   * Data logger constructor
   */
  constructor() {
    this.buildStatistic();
  }

  // --------------------------- Statistic & Clean up --------------------------------------
  /**
   * Builds a statistic out of existing data
   */
  buildStatistic() { // builds a statistic and removes values older than 48h
    setTimeout(() =>
    // todo first build a statistic
      EventModel.remove({timestamp: {$gt: moment().subtract(48, 'hours')}}).exec((err) => {
        if (err) {
          return logger.error;
        }
      })

    , STATISTIC_INTERVALL);
  }

  // --------------------------------------------- Events (Relays) --------------------------------------
  /**
   * Creates an event
   * @param {object} relay
   * @param {string} state
   * @param {string} info
   * @param {*} callback
   */
  createEvent(relay, state, info, callback) {
    const eventData = {
      state,
      relay: relay._id,
      timestamp: moment().toDate(),
    };
    if (info != null) {
      eventData.info = info;
    }
    const newEvent = new EventModel(eventData);
    debugDataLogger('Create new event', newEvent);
    newEvent.save((err, result) => {
      if (err) {
        logger.error(err);
      }
      EventModel.findOne({_id: result._id}).populate('relay').lean().exec((err, eventFound) => {
        if (err) {
          return callback(err);
        }
        sendMessage('eventData', {'payload': eventFound});
        return callback();
      });
    });
  }

  /**
   * Read saved events
   * @param {object} filterReadEvents
   * @param {object} options
   * @param {*} callback
   */
  static readEvents(filterReadEvents, options, callback) { // todo LAST LIMIT
    let Query = EventModel.find(filterReadEvents).sort({'timestamp': -1});

    if (options.limit != null) {
      Query = Query.limit(options.limit);
    }

    if (options.populate && options.populate.relay) {
      Query = Query.populate('relay', {});
    }
    debugDataLogger('Reading events', filterReadEvents, options);
    Query.exec(callback);
  }

  // --------------------------------------------- Data (Sensors) --------------------------------------
  /**
   * Save sensor data to the DB
   * @param {object} sensorId
   * @param {object} detector
   * @param {*} callback
   */
  createSensorData(sensorId, detector, callback) {
    const sensorData = {
      value: detector.currentValue['y'], timestamp: detector.currentValue['x'],
      detectorType: detector.type,
      sensor: sensorId,
    };
    const newSensorData = new SensorDataModel(sensorData);

    newSensorData.save((err) => {
      if (err) {
        logger.error(err);
      }
      return callback();
    });
  }

  /**
   * Clear events from the DB
   * @param {object} filterClearEvents
   * @param {object} options
   * @param {*} callback
   */
  static clearEvents(filterClearEvents, options, callback) {
    EventModel.remove({}).exec(callback);
  }
}
module.exports = DataLogger;
