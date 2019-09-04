'use strict';
const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;
const deepPopulateModule = require('mongoose-deep-populate');

const deepPopulate = deepPopulateModule(mongoose);

const StrainSchema = {
  name: String,
  daysToHarvest: Number,
  leafly: String,
};

const ChamberSchema = new mongoose.Schema({
  name: String,
  cycle: String,
  displays: [{
    type: ObjectId,
    ref: 'Sensor',
  }],
  rules: [{
    type: ObjectId,
    ref: 'Rule',
    validate: {
      validator(value) {
        return (value != null);
      },
      message: '{VALUE} is not valid.',
    },
  }],
  strains: [StrainSchema],
});

ChamberSchema.plugin(deepPopulate, {});

let ChamberModel;
try {
  ChamberModel = mongoose.model('Chamber');
} catch (err) {
  ChamberModel = mongoose.model('Chamber', ChamberSchema);
}
module.exports = {ChamberModel, ChamberSchema};
