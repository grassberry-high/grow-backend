'use strict';
const async = require('async');
const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const {base} = require('./rule.validator');

const RuleSchema = new mongoose.Schema({
  device: String,
  detectorId: ObjectId,
  forDetector: String,
  trigger: String, // timeOnOff, interval, thresholdOnOff, thresholdTime, thresholdOff, alwaysOn
  startTime: {
    type: Date,
  },
  durationHOn: {
    type: Number,
  },
  cronjobs: [
    {
      type: ObjectId,
      ref: 'Rule',
    },
  ],
  offValue: Number, // treshold off
  onValue: Number, // treshold on
  onPattern: String,
  durationMSOn: Number, // switch on for a duration if threshold is met
  durationMBlocked: Number, // block for x ms after threshold was met
  nightOff: Boolean,
  sensor: {
    type: ObjectId,
    ref: 'Sensor',
  },
  relay: {
    type: ObjectId,
    ref: 'Relay',
    required: true,
  },
  unit: String,
}, {versionKey: '2'});

const hooks = (data, callback) =>
  async.parallel([
    (next) => {
      return base(data, next);
    },
  ], (err) => {
    if (err) {
      return callback(new Error(err));
    }
    return callback();
  })
;

RuleSchema.pre('save', function(next) {
  // eslint-disable-next-line no-invalid-this
  return hooks(this, next);
});

RuleSchema.pre('findOneAndUpdate', function(next) {
  // eslint-disable-next-line no-invalid-this
  const data = this._update;
  if (data.$set != null) {
    return next();
  }
  return hooks(data, next);
});

let RuleModel;
try {
  RuleModel = mongoose.model('Rule');
} catch (err) {
  RuleModel = mongoose.model('Rule', RuleSchema);
}
module.exports = {RuleModel, RuleSchema};
