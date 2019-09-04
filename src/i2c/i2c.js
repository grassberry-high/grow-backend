'use strict';
const BUS = 1;

const {inspect} = require('util');
const debug = require('debug');

const debugI2c = debug('busI2c');
const debugI2cVerbose = debug('busI2c:verbose');

const {isEqual, difference} = require('lodash');
const async = require('async');
const os = require('os');

let i2c;
let i2c1;
const i2cMock = require('./mocks/i2c.mock');

if (process.env.USE_I2C_MOCK === 'true') {
  debugI2c('Not using I2C: ENV USE_I2C_MOCK set', os.arch(), 'i2c', i2c);
  i2c = i2cMock;
} else if (os.arch() !== 'arm') {
  debugI2c('Not using I2C', os.arch());
  i2c = i2cMock;
} else { // arm === raspberrypi
  i2c = require('i2c-bus');
  debugI2c('Using I2C', os.arch(), inspect(i2c));
}

const {SensorModel} = require('../sensor/sensor.model');
let activeDevices = [];

/**
 * Boot I2C, scan for devices and watch for new/lost devices
 * @param {*} callback
 */
const bootI2C = (callback) => {
  debugI2c('Booting I2C');
  async.series([
    (next) => i2c1 = i2c.open(BUS, next),
    (next) => scan(next),
  ], callback);
};

/**
 * check for new/lost devices
 * @param {*} callback
 */
const checkDifference = (callback) => {
  let activeDevicesTemp = activeDevices;
  scan((err) => {
    if (err) {
      console.error(err);
    }
    if (!isEqual(activeDevicesTemp, activeDevices)) {
      const differenceLost = difference(activeDevicesTemp, activeDevices);
      const differenceAdded = difference(activeDevices, activeDevicesTemp);
      if (differenceLost.length > 0) {
        debugI2c(`LOST ${differenceLost}`);
      }
      if (differenceAdded.length > 0) {
        debugI2c(`ADDED ${differenceAdded}`);
      }
      activeDevicesTemp = activeDevices;
      return callback(null, {differenceLost, differenceAdded});
    } else {
      return callback(null);
    }
  });
};

/**
 * Scan for devices
 * @param {*} callback
 * @return {*}
 */
const scan = (callback) => {
  if (i2c1) {
    i2c1.scan((err, devices) => {
      if (activeDevices.length === 0) {
        debugI2c(`\n\n====================\nSCAN\n=======================\n${err}`);
      } else {
        debugI2cVerbose(`\n${inspect(devices)}`);
      }
      activeDevices = devices.sort();
      return callback(err, devices);
    });
  } else {
    return callback('I2C not booted (#1)');
  }
};

const adressInActiveDevices = (address) => {
  return activeDevices.indexOf(address) !== -1;
};

const getI2cBus = () => i2c1;

const getActiveDevices = (callback) => {
  if (activeDevices.length === 0) {
    return callback(null, []);
  }
  const filterRead = {address: {$in: activeDevices}};
  let activeDevicesDetail = [];
  async.parallel({
    relays(next) {
      if (activeDevices.indexOf(0x20) !== -1) {
        activeDevicesDetail = activeDevicesDetail.concat([{
          type: 'relay',
          address: 0x20,
          name: 'Relay Controller',
        }]);
      }
      return next();
    },
    sensors(next) {
      SensorModel.find(filterRead).lean().exec((err, sensors) => {
        if (err) {
          return next(err);
        }
        sensors = sensors.map((sensor) => {
          sensor.type = 'sensor';
          return sensor;
        });
        activeDevicesDetail = activeDevicesDetail.concat(sensors);
        return next();
      });
    },
  },
  (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, activeDevicesDetail);
  });
};


// ============================== REPROGRAM WATERSENSOR =========================

const updateI2CAddress = (sensorType, oldAddress, newAddress, callback) => {
  if ((i2c1 == null)) {
    return callback('I2C not active');
  }
  if (sensorType === 'waterSensor') {
    const watersensorRegister = 0x01;
    async.series([
      (next) => {
        debugI2c(`Setting waterSensor from ${oldAddress} (${oldAddress.toString(16)}) to ${newAddress} (${newAddress.toString(16)})`);
        i2c1.writeByte(oldAddress, watersensorRegister, newAddress, next);
      },
      (next) => {
        const commandReset = 0x06;
        debugI2c('Resetting waterSensor');
        // i2c1.writeByte oldAddress, watersensorRegister, commandReset, next
        i2c1.sendByte(oldAddress, commandReset, next);
      },
    ], (err) => callback(err));
  } else {
    return callback('Only allowed for sensor type water sensor');
  }
};
module.exports = {bootI2C, scan, adressInActiveDevices, checkDifference, getI2cBus, getActiveDevices, updateI2CAddress};


// via I2c Tools
// i2cdetect 1 #detects I2c Devices on bus 1
// i2cset -y 1 0x20 0x01 0x21 #wirtes new address to water sensor
// i2cset -y 1 0x20 0x06 #resets the water sensor
