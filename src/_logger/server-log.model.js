'use strict';

const ONE_WEEK = 60 * 60 * 24 * 7;
const mongoose = require('mongoose');

const ServerLogSchema = new mongoose.Schema({
  message: {
    type: String,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    expires: ONE_WEEK,
  },
  level: String,
  meta: {},
});

let ServerLogModel;
try {
  ServerLogModel = mongoose.model('ServerLog');
} catch (err) {
  ServerLogModel = mongoose.model('ServerLog', ServerLogSchema);
}
module.exports = {ServerLogModel, ServerLogSchema};
