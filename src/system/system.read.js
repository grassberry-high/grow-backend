'use strict';
const debugSystemRead = require('debug')('system:read');

const moment = require('moment');

const {SystemModel} = require('./system.model');

const getSystem = (options, callback) => {
  const filter = options.filter || {};
  SystemModel.findOne(filter).exec((err, system) => {
    if (err) {
      return callback(err);
    }
    debugSystemRead('Found system info', system);
    return callback(null, system);
  });
};

const isValid = (callback) => {
  const options = {};
  getSystem(options, (err, system) => {
    if (err) {
      return callback(err);
    }
    if (!system || !system.validTill) {
      return callback(null, false);
    }
    callback(null, moment(system.validTill).diff(moment(), 'seconds') > 0);
  });
};
module.exports = {getSystem, isValid};
