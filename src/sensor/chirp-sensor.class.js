'use strict';
const CMD_READ_WATER_LEVEL = 0x00; // 2bytes
const STATUS_DRY = 0;
// const STATUS_WET = 2;
const WATERLEVELS = ['Dry', 'Moist', 'Wet'];

// CMD_ACCESS_CONFIG = 0xac
// CMD_READ_TEMP = 0xaa
// CMD_START_CONVERT = 0xee

const chalk = require('chalk');

const moment = require('moment');
const debug = require('debug');

const debugSensorChrip = debug('sensor:Water');

const Sensor = require('./sensor.class.js');

/**
 * Chirp is a water level sensor.
 */
class ChirpSensor extends Sensor {
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    debugSensorChrip(`Water sensor ${options._id}`);
    options.modes = options.modes || {};
    super(options, (err) => {
      if (err) {
        return callback(err);
      }
      this.boot((err) => {
        if (err) {
          return callback(err);
        }
        that.readSensor();
        return callback(null, that);
      });
    });
  }

  /**
   * Boots the sensor
   * @param {*} callback
   */
  boot(callback) {
    setTimeout(() => callback(), 100);
  }

  /**
   * Translate water level to text
   * @param {number} waterLevel - waterLevel
   * @return {string} waterLevel
   */
  static translateToHuman(waterLevel) {
    waterLevel = Math.round(waterLevel);
    if ((waterLevel == null) || (WATERLEVELS[waterLevel - 1] == null)) {
      return 'No valid waterlevel';
    }
    return WATERLEVELS[waterLevel - 1];
  }

  /**
   * Measures how long the soil stays wet
   * @param {number} waterLevel: current waterLevel
   */
  setWetTimeSpan(waterLevel) { // measures the time the soil stays moist/wet
    const self = this;
    if (self.lastWaterLevel !== waterLevel) {
      if (waterLevel > STATUS_DRY) {
        self.startWet = moment();
      } else if ((waterLevel === STATUS_DRY) && (self.startWet != null)) {
        self.wetTimeSpan = moment().diff(self.startWet, 'seconds');
      }
      self.lastWaterLevel = waterLevel;
    }
  }

  /**
   * Read the chirp water sensor
   */
  readSensor() {
    const self = this;
    if (this.i2c1 != null) {
      this.i2c1.readByte(self.address, CMD_READ_WATER_LEVEL, (err, waterLevel) => {
        if (err) {
          console.log(chalk.bgRed(err));
        }
        if (!err && (waterLevel != null)) {
          debugSensorChrip(`WATERLEVEL: ${waterLevel} ${ChirpSensor.translateToHuman(waterLevel)} ${moment().format('hh:mm DD-MM-YYYY')}`);
          self.setWetTimeSpan(waterLevel);
          self.processSensorValue(self.detectors[0], waterLevel, () => {
          });
        }
        setTimeout(() => self.readSensor(), self.sensorReadIntervall);
      });
    } else {
      setTimeout(() => self.readSensor(), self.sensorReadIntervall);
    }
  }
}

module.exports = ChirpSensor;
