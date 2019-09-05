'use strict';
const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;
const CronjobSchema = new mongoose.Schema({
  relay: {
    type: ObjectId,
    ref: 'Relay',
    required: true,
  },
  action: String,
  cronPattern: String,
  ruleId: ObjectId,
});

let CronjobModel;
try {
  CronjobModel = mongoose.model('Cronjob');
} catch (err) {
  CronjobModel = mongoose.model('Cronjob', CronjobSchema);
}
module.exports = {CronjobModel, CronjobSchema};
