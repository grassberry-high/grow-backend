'use strict';
const KB = 1024; // kilobyte
const MB = KB * 1024; // megabyte

const {SensorDataModel} = require('../data-logger/sensor-data.model');

const getDbSize = (collection, callback) => {
  if (collection === 'sensordata') {
    SensorDataModel.collection.stats({scale: MB}, (err, results) => {
      if (err) {
        return callback(err);
      }
      return callback(null, results.storageSize);
    });
  } else {
    return callback(`Operation not supported for collection ${collection}`);
  }
};
module.exports = {getDbSize};
