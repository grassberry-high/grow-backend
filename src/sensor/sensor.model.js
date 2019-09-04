'use strict';
const async = require('async');
const mongoose = require('mongoose');

const DetectorSchema = {
  label: String,
  name: String,
  type: {type: String},
  unit: String,
};

const SensorSchema = new mongoose.Schema({
  technology: String, // I2C or BLE
  model: String,
  address: {
    type: Number, // I2C & BLE sensor
    unique: true,
    sparse: true,
  },
  uuid: {
    type: String, // BLE sensor
    unique: true,
    sparse: true,
  },
  detectors: [DetectorSchema],
});

// -----------------------------------------------  Sensor Validation ----------------------------------------
const validate = (data, next) => {
  const err = [];
  switch (data.technology) {
    case 'ble':
      if ((data.uuid == null)) {
        err.push('uuid is required');
      }
      delete data.address;
      break;

    case 'i2c':
      if ((data.address == null)) {
        err.push('I2C address is required');
      }
      delete data.uuid;
      break;
  }
  if (err.length > 0) {
    return next(err.join('\n'));
  }
  return next();
};


const hooks = (data, callback) =>
  async.parallel({
    validate(next) {
      return validate(data, next);
    },
  },
  (err) => {
    if (err) {
      return callback(err);
    }
    return callback();
  })
;

SensorSchema.pre('save', function(next) {
  // eslint-disable-next-line no-invalid-this
  return hooks(this, next);
});

SensorSchema.pre('findOneAndUpdate', function(next) {
  // eslint-disable-next-line no-invalid-this
  const data = this._update;
  if (data.$set != null) {
    return next();
  }
  return hooks(data, next);
});

// -----------------------------------------------  Sensor module.exports----------------------------------------

let SensorModel;
try {
  SensorModel = mongoose.model('Sensor');
} catch (err) {
  SensorModel = mongoose.model('Sensor', SensorSchema);
}
module.exports = {SensorModel, SensorSchema};
