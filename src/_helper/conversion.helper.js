'use strict';
const debug = require('debug');
const debugHelperConversion = debug('helper:conversion');

const moment = require('moment-timezone');

const {getSystem} = require('../system/system.read');

let timeZone = null;

exports.setTimeZone = (callback) => {
  const options = {};
  getSystem(options, (err, system) => {
    if (err) {
      return callback(err);
    }
    if (!system) {
      return callback();
    }
    if (system.timeZone) {
      ({timeZone} = system);
    }
    debugHelperConversion('timeZone: ', timeZone);
    return callback();
  });
};


exports.formatTimeToLocalTime = (dateTime, format) => {
  if (timeZone) {
    return moment.tz(dateTime, timeZone).format(format).toString();
  }
  return moment(dateTime).format(format).toString();
};

exports.getLocalTime = (format) => {
  const localTime = this.formatTimeToLocalTime(moment(), format);
  debugHelperConversion('localTime', localTime);
  return localTime;
};