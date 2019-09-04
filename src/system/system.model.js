'use strict';

const mongoose = require('mongoose');

const SystemSchema = new mongoose.Schema({
  enabledFeatures: mongoose.Schema.Types.Mixed,
  version: String,
  region: String,
  timeZone: String,
  units: {
    temperature: String,
  },
  serial: String,
  wifi: String,
  lastConnect: Date,
});

let SystemModel;
try {
  SystemModel = mongoose.model('System');
} catch (err) {
  SystemModel = mongoose.model('System', SystemSchema);
}
module.exports = {SystemModel, SystemSchema};
