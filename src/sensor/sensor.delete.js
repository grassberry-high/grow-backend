'use strict';
const {SensorModel} = require('./sensor.model');

const removeSensor = (id, options, callback) => SensorModel.remove({_id: id}).exec((err) => callback(err));
module.exports = {removeSensor};
