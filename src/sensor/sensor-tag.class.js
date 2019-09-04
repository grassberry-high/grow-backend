'use strict';
const TemperatureSensorIndex = 0;
const HumiditySensorIndex = 1;

const {inspect} = require('util');
const debug = require('debug');

const debugSensorTag = debug('sensorTag');
const debugSensorTagTemperature = debug('sensorTag:temperature');
const debugSensorTagHumidity = debug('sensorTag:humidity');

const async = require('async');

const Sensor = require('./sensor.class');
const SensorTag = require('sensortag');

/**
 * Sensor tag sensor
 */
class SensorTagSensor extends Sensor {
  /**
   * Constructor function
   * @param {object} options - sensor options
   * @param {*} callback - fn(err)
   */
  constructor(options, callback) {
    super(options, (err) => {
      this.onDiscover = this.onDiscover.bind(this);
      debugSensorTag('options', options);
      for (const key in options) {
        if (Object.prototype.hasOwnProperty.call(options, key)) {
          this[key] = options[key];
        }
      }
      this.bootStatus = false;
      this.discoverById();
      return callback(null, this);
    });
  }

  // ---------------------- READ functions ------------------------------------------------
  /**
   * Read the battery level
   * @param {object} sensorTag - sensor tag unit
   * @param {*} callback
   */
  readBatteryLevel(sensorTag, callback) {
    sensorTag.readBatteryLevel((error, batteryLevel) => {
      debugSensorTag('Battery', error, `${batteryLevel}%`);
      return callback();
    });
  }

  /**
   * Read infrared temperature
   * @param {object} sensorTag - sensor tag unit
   * @param {*} callback
   */
  readIrTemperature(sensorTag, callback) {
    sensorTag.readIrTemperature((err, objectTemperature, ambientTemperature) => {
      if (err) {
        return callback(err);
      }
      return callback(null, objectTemperature, ambientTemperature);
    });
  }

  // ---------------------- LAUNCH devices ------------------------------------------------
  /**
   * Enable temperature measuring
   * @param {object} sensorTag - sensor tag unit
   * @param {*} callback
   */
  enableTemperature(sensorTag, callback) {
    const self = this;
    async.series([
      (next) => sensorTag.enableIrTemperature(next),
      (next) => sensorTag.notifyIrTemperature(next),
      (next) => {
        sensorTag.on('irTemperatureChange', (objectTemperature, ambientTemperature) => {
          debugSensorTagTemperature(`objectTemperature ${objectTemperature}, ambientTemperature ${ambientTemperature}`);
          self.processSensorValue(self.detectors[TemperatureSensorIndex], ambientTemperature, () => {
          });
        });
        return next();
      },
    ], (err) => callback(err));
  }

  /**
   * Enable humidity measuring
   * @param {object} sensorTag - sensor tag unit
   * @param {*} callback
   */
  enableHumidity(sensorTag, callback) {
    const self = this;
    async.series([
      (next) => sensorTag.enableHumidity(next),
      (next) => sensorTag.notifyHumidity(next),
      (next) => {
        sensorTag.on('humidityChange', (temperature, humidity) => {
          debugSensorTagHumidity(`temperature ${temperature}, humidity ${humidity}`);
          self.processSensorValue(self.detectors[HumiditySensorIndex], humidity, () => {
          });
        });
        return next();
      },
    ], (err) => callback(err));
  }

  // --------------------------------------------------- Discover Sensors -------------------------------------------------------
  /**
   * On discovering the sensor tag
   * @param {object} sensorTag - sensor tag unit
   */
  onDiscover(sensorTag) {
    const self = this;
    debugSensorTag(`Discovered uuid: ${sensorTag.uuid}, address: ${sensorTag.address}, rssi ${sensorTag.rssi}, type: ${sensorTag.type}`);// , inspect sensorTag

    sensorTag.once('disconnect', (err) => {
      if (err) {
        return debugSensorTag('Disconnected: ', err);
      }
    });

    // setup the found BLE sensor
    async.series([
      (next) => sensorTag.connectAndSetUp(next),
      (next) => self.readBatteryLevel(sensorTag, next),
      (next) => self.enableTemperature(sensorTag, next),
      (next) => self.enableHumidity(sensorTag, next),
    ], (err) => {
      if (err) {
        debugSensorTag(`ERR`, inspect(err));
      } else {
        self.bootStatus = true;
      }
    });
  }

  /**
   * Discover sensor tag by id
   * @param {object} sensorTag - sensor tag unit
   * @param {*} callback
   * @return {*}
   */
  discoverById() {
    if (this.uuid) {
      return SensorTag.discoverById(this.uuid, this.onDiscover);
    }
  }
}

// discoverAll: (callback)->
//   SensorTag.discoverAll(callback)
//   return null

// stopDiscoverAll: ()->
//   SensorTag.stopDiscoverAll()
//   return
module.exports = SensorTagSensor;
