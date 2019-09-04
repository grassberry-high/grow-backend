'use strict';
const debug = require('debug');
const debugRules = debug('rules');

const mongoose = require('mongoose');
const _ = require('lodash');

const {RuleModel} = require('./rule.model');

const getRules = (options, callback) => {
  const filter = options.filter || {};
  debugRules('filter', filter);
  RuleModel.find(filter).exec((err, rulesFound) => {
    if (err) {
      return callback(err);
    }
    return callback(null, rulesFound);
  });
};

const upsertRule = (upsertRule, callback) => {
  if (!upsertRule._id) {
    upsertRule._id = new mongoose.mongo.ObjectID();
  }
  RuleModel.findOneAndUpdate({_id: upsertRule._id}, _.omit(upsertRule, '_id'), {
    'upsert': true,
    'new': true,
  }).exec((err, result) => {
    if (err) {
      return callback(err);
    }
    return callback(null, result);
  });
};

const removeRule = (_id, callback) =>
  RuleModel.remove({_id}).exec((err, result) => {
    if (err) {
      return callback(err);
    }
    return callback(null, result);
  });
module.exports = {getRules, upsertRule, removeRule};
