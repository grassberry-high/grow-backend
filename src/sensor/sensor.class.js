'use strict';
const HISTORY_LENGTH = 30;
const ONE_SECOND_IN_MILLISECONDS = 1000;
const ONE_MINUTE_IN_MILLISECONDS = 60 * ONE_SECOND_IN_MILLISECONDS;
const ONE_HOUR_IN_MILLISECONDS = 60 * ONE_MINUTE_IN_MILLISECONDS;
const STATISTIC_INTERVALL = HISTORY_LENGTH * 60 * 1000; // max time unit is hours

const {inspect} = require('util');
const debug = require('debug');

const debugSensorFilter = debug('sensor:filter');
const debugSensorSwitch = debug('sensor:switch');
const debugSensorBroadcast = debug('sensor:broadcast');
const debugSensorSwitchVerbose = debug('sensor:switch:verbose');
const debugSensorSwitchBlockers = debug('sensor:switch:blockers');

const async = require('async');
const {orderBy, sortBy} = require('lodash');
const moment = require('moment');
const fs = require('fs');
const KalmanFilter = require('kalmanjs');

const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;
const {SensorDataModel} = require('../data-logger/sensor-data.model');


const {sendMessage} = require('../_socket-io/socket-io-messenger.js');
const {logger} = require('../_logger/logger.js');

const {getRules} = require('../rule/rule.service.js');
const {getRelayById, operateRelay, blockRelay} = require('../relay/relay.service.js');

const DataLogger = require('../data-logger/data-logger.class.js');

const dataLogger = new DataLogger();
const {getI2cBus} = require('../i2c/i2c.js');

/**
 * Basic sensor class
 */
class Sensor {
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    // console.info "options", options
    this.sensorSaveValueToDb = dataLogger.createSensorData;
    const that = this;
    this._id = options._id || (() => {
      throw new Error('Id is required');
    })();
    this.model = options.model || (() => {
      throw new Error('Model is required');
    })();
    if ((!options.detectors) || (options.detectors.length === 0)) {
      throw new Error('At least one detector is required');
    }
    this.detectors = options.detectors || [];
    this.technology = options.technology;

    if (options.technology === 'i2c') {
      this.i2c1 = getI2cBus();
      this.address = options.address || (() => {
        throw new Error('Address is required');
      })();
    }

    this.sensorReadIntervall = 1000; // read sensor each s
    this.sensorPushIntervall = 5000; // push sensor each 5s
    this.sensorWriteIntervall = 5000; // write sensor each 5s
    this.timeUnit = 'seconds';
    debugSensorFilter(options.modes);
    this.modes = options.modes || {adjustValues: 5};
    if (this.modes.kalman != null) {
      this.kalmanFilter = new KalmanFilter(this.modes.kalman); // R internal variation, Q expected variation through noise
    }


    async.eachSeries(this.detectors,
      (detector, next) => {
        detector.history = [];
        detector.shortBuffer = [];
        detector.currentValue = null;
        detector.rules = [];
        that.initRules(detector);
        that.readSensorHistory(detector, (err, history) => {
          detector.history = history || [];
          return next(err);
        });
      },
      (err) => {
        if (err) {
          console.error(err);
        }
        that.buildStatistic();
        // logger.info "Activated Sensor  #{inspect options}"
        return callback(err, this);
      });
  }

  /**
   * Get the sensor
   * @return {Sensor}
   */
  getSensor() {
    return this;
  }

  // --------------------------- Statistic & Clean up --------------------------------------
  /**
   * Build sensor statistic
   */
  buildStatistic() { // builds a statistic and removes values older than 48h
    setTimeout(() => {
      this.detectors.map((detector) =>
      // todo first build a statistic
        SensorDataModel.remove({
          sensor: this._id,
          detectorType: detector.type,
          timestamp: {$gt: moment().subtract(48, 'hours')},
        }).exec((err) => {
          if (err) {
            return logger.error;
          }
        }));
    }
    , STATISTIC_INTERVALL);
  }

  // --------------------------- Sensor Process, Write & Broadcast --------------------------------------
  /**
   * Check if last write is long enough ago
   * @param {object} detector
   * @return {boolean}
   */
  checkWrite(detector) {
    if ((!detector.lastWrite) || (moment().diff(detector.lastWrite) >= this.sensorWriteIntervall)) {
      detector.lastWrite = moment();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Check if last push is long enough ago
   * @param {object} detector
   * @return {boolean}
   */
  checkPush(detector) {
    // console.log "#{detector.type} diff #{moment().diff(detector.lastPush)} #{@.timeUnit} #{@.sensorPushIntervall}"
    if ((!detector.lastPush) || (moment().diff(detector.lastPush) >= this.sensorPushIntervall)) {
      detector.lastPush = moment();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Change the measuring interval
   * @param {string} newTimeUnit
   * @param {*} callback
   * @return {*}
   */
  changeSensorTimeUnit(newTimeUnit, callback) {
    const self = this;
    switch (newTimeUnit) {
      case 'seconds':
        self.sensorPushIntervall = 5 * ONE_SECOND_IN_MILLISECONDS; // ms
        break;
      case 'minutes':
        self.sensorPushIntervall = ONE_MINUTE_IN_MILLISECONDS;
        break;
      case 'hours':
        self.sensorPushIntervall = ONE_HOUR_IN_MILLISECONDS;
        break;
      default:
        return callback(new Error('Time unit is not valid'));
    }

    this.timeUnit = newTimeUnit;
    async.each(this.detectors,
      (detector, next) =>
        self.readSensorHistory(detector, (err, history) => {
          history = history || [];
          if (err) {
            return next(err);
          }
          detector.history = history || [];
          return next();
        })
      ,
      (err) => {
        if (err) {
          return callback(err);
        }
        return callback(null, self);
      });
  }

  /**
   * Broadcast the sensor history to the FE
   */
  broadcastSensorHistory() {
    debugSensorBroadcast('Broadcasting sensorData', {'payload': this});
    sendMessage('sensorData', {'payload': this});
  }

  /**
   * Save values in pipe buffer
   * @param {object} detector
   * @param {number} value
   * @return {number}
   */
  adjustValue(detector, value) {
    const nrValues = this.modes.adjustValues;
    if (detector.shortBuffer.length >= nrValues) {
      value = (value + detector.shortBuffer.slice(detector.shortBuffer.length - nrValues).reduce((prev, curr) => prev + curr)) / (nrValues + 1);
      detector.shortBuffer.push(value);
      if (detector.shortBuffer.length > nrValues) {
        detector.shortBuffer.shift();
      }
    } else {
      detector.shortBuffer.push(value);
    }
    return value;
  }

  /**
   * Process the sensor value
   * @param {object} detector
   * @param {number} newValue
   * @param {*} callback
   * @return {*}
   */
  processSensorValue(detector, newValue, callback) {
    const self = this;
    if (isNaN(newValue)) {
      return callback();
    }
    if (this.modes.adjustValues != null) {
      newValue = this.adjustValue(detector, newValue);
    } else if (this.kalmanFilter != null) {
      const historyY = detector.history.map((value) => value.y);
      historyY.push(newValue);
      debugSensorFilter(`Before Kalman: ${newValue}`);
      if (process.env.LOG_KALMAN === 'true') {
        fs.appendFile(process.env.APP_PATH + `/logs/kalman_${detector.name}.csv`, `${newValue};`, 'utf-8', () => {
        });
      }
      newValue = historyY.map((value) => self.kalmanFilter.filter(value)).pop();
      debugSensorFilter(`After Kalman: ${newValue}`);
      if (process.env.LOG_KALMAN === 'true') {
        fs.appendFile(process.env.APP_PATH + `/logs/kalman_${detector.name}.csv`, `${newValue}\n`, 'utf-8', () => {
        });
      }
    }

    if (detector.round === true) {
      newValue = Math.round(newValue);
    }
    detector.currentValue = {x: moment().toDate(), y: newValue}; // .startOf('minute')
    this.applyRules(detector);

    async.parallel({
      sensorPush(next) {
        if (!self.checkPush(detector)) {
          return next();
        }
        detector.history.push(detector.currentValue);
        if (detector.history.length > HISTORY_LENGTH) {
          detector.history.shift();
        }
        detector.history = orderBy(detector.history, 'x');
        self.broadcastSensorHistory();
        return next();
      },
      sensorWrite(next) {
        if (!self.checkWrite(detector)) {
          return next();
        }
        self.sensorSaveValueToDb(self._id, detector, next);
      },
    },
    callback);
  }

  // --------------------------- Sensor Read --------------------------------------
  /**
   * Filter the sensor's history
   * @param {object[]} data
   * @param {*} callback
   * @return {*}
   */
  filterSensorHistory(data, callback) {
    const self = this;
    data = sortBy(data, 'timestamp').reverse();
    let lastEntry = moment(data[0].timestamp).add(5, self.timeUnit)
    ; // add 5 units to the last entry (for processing delay), works seconds & minutes
    data = data.filter((dataItem, index) => {
      if (lastEntry.diff(moment(dataItem.timestamp), self.timeUnit) <= 1) {
        return false;
      } // if less than 1 time unit diff. reject
      lastEntry = moment(dataItem.timestamp);
      return true;
    });
    data = data.splice(0, HISTORY_LENGTH);
    data = data.map((dataItem) => ({x: moment(dataItem.timestamp).toDate(), y: dataItem.value}));
    data.reverse();
    return callback(null, data);
  }

  /**
   * Read the sensor's history
   * @param {object} detector
   * @param {*} callback
   */
  readSensorHistory(detector, callback) {
    let since;
    const self = this;

    if (this.timeUnit === 'seconds') {
      since = moment().subtract((HISTORY_LENGTH + 1) * this.sensorReadIntervall, 'seconds').toISOString();
    } else {
      since = moment().subtract((HISTORY_LENGTH + 1), this.timeUnit).toISOString();
    }

    const filterReadSensor = {sensor: new ObjectId(this._id), detectorType: detector.type, timestamp: {$gt: since}};
    SensorDataModel.find(filterReadSensor).exec((err, data) => {
      if (err) {
        return callback(err);
      }
      if ((!data) || (data.length === 0)) {
        return callback(null, []);
      }
      self.filterSensorHistory(data, callback);
    });
  }


  // --------------------------- Init/apply Rules --------------------------------------
  /**
   * Init sensor rules
   * @param {object} detector
   */
  initRules(detector) {
    const options = {
      filter: {
        sensor: this._id,
        forDetector: detector.type,
        trigger: {$in: ['thresholdOnOff', 'thresholdTimer']}, // restricted rules to current implementation, TODO: rebuild rule system for diff. rule types
      },
    };
    getRules(options, (err, rulesFound) => {
      if (err) {
        logger.error(err);
      }
      detector.rules = rulesFound;
    });
  }

  /**
   * Apply rules
   * @param {object} detector
   */
  applyRules(detector) {
    detector.rules.forEach((rule) => {
      let counterOperation; let operation; let state; let statusOff; let statusOn;
      debugSensorSwitchVerbose(`Currrent Value: ${detector.currentValue.y}`, 'rule', inspect(rule));
      let info = `Because ${detector.currentValue.y.toFixed(2)} ${rule.forDetector} was `;
      if ((rule.device === 'pump') && (rule.onValue > detector.currentValue.y)) { // pumps are triggered when water level is below 2 (moist)
        statusOn = true;
        info = 'Because soil was dry.';
      } else if (rule.onValue > rule.offValue) { // threshold if exceeds
        if (rule.onValue < detector.currentValue.y) {
          statusOn = true;
          info += `higher then ${rule.onValue}`;
        } else if (rule.offValue > detector.currentValue.y) {
          statusOff = true;
          info += `lower then ${rule.offValue}`;
        }
      } else {
        if (rule.onValue > detector.currentValue.y) {
          statusOn = true;
          info += `lower then ${rule.onValue}`;
        } else if (rule.offValue < detector.currentValue.y) {
          statusOff = true;
          info += `higher then ${rule.offValue}`;
        }
      }

      if (statusOn) {
        operation = 'switchOn';
        counterOperation = 'switchOff';
        state = 1;
      } else if (statusOff) {
        operation = 'switchOff';
        counterOperation = 'switchOn';
        state = 0;
      } else {
        return null;
      }
      // check if it is already in the required state
      getRelayById(rule.relay, (err, relay) => {
        if (err || !relay) {
          console.error(`Could not find relay ${err} ${rule.relay}`);
          return;
        }
        debugSensorSwitchVerbose(relay.name, `on value ${rule.onValue} off value ${rule.offValue} State change: ${relay.state !== state}`);
        debugSensorSwitchVerbose('blocked (by)', ((relay.blockedBy != null) && (relay.blockedBy !== detector._id)));
        debugSensorSwitchBlockers('blockedBy (till)', ((relay.blockedTill != null) && moment(relay.blockedTill).diff(moment(), 'seconds')));
        debugSensorSwitchBlockers('pump (&blocked)', ((rule.device === 'pump') && ((rule.durationMSOn == null) || (rule.durationMBlocked == null))));
        debugSensorSwitchBlockers('nightM', (((rule.nightOff != null) && (moment().hour() >= 22)) || (moment().hour() <= 10)), 'hour', moment().hour());

        if ((relay) && (relay.state !== state) && (operation)) {
          if ((relay.blockedBy) && (relay.blockedBy !== detector._id)) {
            return null;
          }

          debugSensorSwitchVerbose('Relay not blocked by');
          if ((relay.blockedTill != null) && (moment(relay.blockedTill).diff(moment(), 'seconds') > 0)) {
            debugSensorSwitchVerbose(`Relay blocked till ${moment(relay.blockedTill).diff(moment(), 'seconds')}`);
          }
          if ((relay.blockedTill != null) && (moment(relay.blockedTill).diff(moment(), 'seconds') > 0)) {
            return null;
          }
          debugSensorSwitchVerbose('Relay not blocked till');

          if ((rule.device === 'pump') && ((rule.durationMSOn == null) || (rule.durationMBlocked == null))) {
            return null;
          }
          if ((rule.nightOff === true) && ((moment().hour() >= 22) || (moment().hour() <= 10))) {
            return null;
          }
          debugSensorSwitchVerbose('No night off/night mode');
          debugSensorSwitch(`SWITCHED ${operation}`);
          // if different operate the relay
          operateRelay(rule.relay, operation, info, detector._id, (err) => {
            if (err) {
              logger.error(err);
            }

            // if a duration exists, counter rule is applied
            if (rule.durationMSOn != null) {
              blockRelay(rule.relay, rule.durationMBlocked, (err) => {
                if (err) { // in case of error revert to prevent water damage
                  logger.error(err);
                  operateRelay(rule.relay, counterOperation, 'counter operation', detector._id, (err) => {
                    if (err) {
                      return logger.error(err);
                    }
                  });
                } else {
                  debugSensorSwitch('Counter operation set');
                  setTimeout(() => {
                    debugSensorSwitch('Counter operation triggered');
                    operateRelay(rule.relay, counterOperation, 'counter operation', detector._id, (err) => {
                      if (err) {
                        return logger.error(err);
                      }
                    });
                  }
                  , rule.durationMSOn);
                }
              });
            }
          });
        }
      });
    });
  }
}

module.exports = Sensor;
