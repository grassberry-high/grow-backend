'use strict';
const mongoose = require('mongoose');
const _ = require( 'lodash');

const {SensorModel} = require('./sensor.model');

const upsertSensor = (upsertSensor, options, callback) => {
  if (!upsertSensor._id) {
    upsertSensor._id = new mongoose.mongo.ObjectID();
  }
  SensorModel.findOneAndUpdate({_id: upsertSensor._id}, _.omit(upsertSensor, '_id'), {upsert: true}).exec((err, upsertSensor) => {
    if (err) {
      return callback(err);
    }
    return callback(null, upsertSensor);
  });
};

const updateDetectorName = (detectorId, newDetectorName, options, callback) => {
  const errors = [];
  if (detectorId === null) {
    errors.push(new Error('DetectorId is required for this operation'));
  }
  if (newDetectorName === null) {
    errors.push(new Error('New detector name is required for this operation'));
  }
  if (errors.length > 0) {
    return callback(errors);
  }
  SensorModel.update({'detectors._id': detectorId}, {$set: {'detectors.$.name': newDetectorName}}).exec((err) => callback(err));
};
module.exports = {upsertSensor, updateDetectorName};
