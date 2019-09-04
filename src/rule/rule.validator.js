'use strict';
const debugRuleValidator = require('debug')('rule:validator');

// ------------------------------------------- VALIDATE BASIC PROPERTIES ------------------------------
exports.base = (data, next) => {
  let err = '';
  debugRuleValidator('data', data);
  switch (data.trigger) {
    case 'timeOnOff':
      if (data.startTime == null) {
        err += 'No start time specified';
      }
      if (data.durationHOn == null) {
        err += 'No duration specified';
      }
      if (data.cronjobs == null) {
        err += 'Couldn\'t create start/stop autmatic, please contact support';
      }
      break;
    case 'interval':
      if (data.onPattern == null) {
        err += 'No interval specified';
      }
      if (data.durationMSOn == null) {
        err += 'No duration specified';
      }
      break;
    case 'thresholdOnOff':
      if (data.onValue == null) {
        err += 'No threshold \'on\' specified';
      }
      if (data.offValue == null) {
        err += 'No threshold \'off\' specified';
      }
      if (data.sensor == null || data.forDetector == null  || data.detectorId == null) {
        err += 'No sensor specified';
      }
      break;
    case 'thresholdTimer':
      if (data.onValue == null) {
        err += 'No threshold \'on\' specified';
      }
      if (data.durationMSOn == null) {
        err += 'No duration (ms) specified';
      }
      if (data.sensor == null || data.forDetector == null  || data.detectorId == null) {
        err += 'No sensor specified';
      }
      break;
    case 'thresholdOff':
      if (data.offValue == null) {
        err += 'No threshold \'off\' specified';
      }
      if (data.sensor == null || data.forDetector == null  || data.detectorId == null) {
        err += 'No sensor specified';
      }
      break;
    case 'alwaysOn':
      break;
    default:
      err += `Rule trigger ${data.trigger} not known`;
  }

  if (err !== '') {
    debugRuleValidator('err', err);
    return next(err);
  }
  return next();
};
