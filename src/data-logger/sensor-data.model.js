'use strict';
const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const SensorDataSchema = new mongoose.Schema({
  sensor: {
    type: ObjectId,
    ref: 'Sensor',
    required: true,
  },
  detectorType: String,
  value: Number,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

let SensorDataModel;
try {
  SensorDataModel = mongoose.model('SensorData');
} catch (err) {
  SensorDataModel = mongoose.model('SensorData', SensorDataSchema);
}
module.exports = {SensorDataModel, SensorDataSchema};
