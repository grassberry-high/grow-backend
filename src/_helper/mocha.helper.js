'use strict';
const debugHelperMocha = require('debug')('helper:mocha');
const ObjectId = require('mongoose').Types.ObjectId;

const comparisonHelper = require('./comparison.helper');
/**
 *
 * @param {object} original: original object
 * @param {object} options: [deleteId: removes _id deep, deleteCreatedAt: removes createdAt deep, defaultDates: sets all dates to defaultDates (ISOString)]
 * @return {*}
 */
const normalizeMongoose = (original = null, options = {}) => {
  if ( !original ) {
    return null;
  }
  if (Array.isArray(original)) {
    debugHelperMocha('Is array');
    return original.map( (element) => {
      return normalizeMongoose(element, options);
    });
  } else if (comparisonHelper.determineType( original ) === 'objectId') {
    debugHelperMocha('Is objectId');
    return original.toString();
  } else {
    delete original.__v;
    if (options.deleteId === true) {
      delete original._id;
      delete original.humanReadableId;
    }
    if (options.deleteCreatedAt === true) {
      delete original.createdAt;
    }
    if (options.deleteUpdatedAt === true) {
      delete original.updatedAt;
    }
    Object.keys( original ).forEach( (key) => {
      const type = comparisonHelper.determineType( original[key] );
      debugHelperMocha(key, type);
      switch (type) {
        case 'date':
          original[key] = original[key].toISOString();
          if (options.defaultDates) {
            original[key] = options.defaultDates;
          }
          break;
        case 'objectId':
          original[key] = original[key].toString();
          break;
        case 'object':
          original[key] = normalizeMongoose(original[key], options);
          break;
        case 'array':
          original[key] = normalizeMongoose(original[key], options);
          break;
      }
    });
    return original;
  }
};

const castToObjectIds = (plainIds) => {
  if (!Array.isArray(plainIds)) return plainIds;
  return plainIds.map( (id) => new ObjectId(id) );
};

module.exports = {normalizeMongoose, castToObjectIds};
