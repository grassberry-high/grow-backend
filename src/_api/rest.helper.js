'use strict';
const debug = require('debug');

const debugRestHelper = debug('helper:rest');
const debugRestHelperVerbose = debug('helper:rest:verbose');

const _ = require('lodash');
const request = require('request');

const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

const {determineType} = require('../_helper/comparison.helper');
const {logger} = require('../_logger/logger');
const {dumpError} = require('../_helper/log-error.helper');


const token = process.env.API_TOKEN || 'newKidsOntheBlock';

const bsonToJson = (bson) => {
  // mongoose object
  if (bson.toObject) {
    bson = bson.toObject({'depopulate': true});

    // mongoose ID
  } else if (bson instanceof ObjectId) {
    bson = bson.toString();
  }

  if (['array', 'object'].indexOf(determineType(bson)) !== -1) {
    bson = _.forEach(bson, (value, key) => {
      if (value != null) {
        bson[key] = bsonToJson(bson[key]);
      } else {
        delete bson[key];
      }
    });
  }
  return bson;
};

/**
 * Adds the sending method to the request
 * @param  {string} method
 * @param {string} url
 * @return {*}
 */
const addMethod = (method, url) => {
  switch (method.toLowerCase()) {
    case 'post':
      return request.post(url);
    case 'get':
      return request.get(url);
    case 'update':
      return request.update(url);
    case 'delete':
      return request.delete(url);
    default:
      throw new Error('method not supported');
  }
};

/**
 * Formats the data and adds it to the request
 * @param {object} emitRequest
 * @param {string} method
 * @param {object} data
 * @return {*}
 */
const addData = (emitRequest, method, data) => {
  switch (method.toLowerCase()) {
    case 'post':
      return emitRequest.json(data);
    case 'get':
      return emitRequest;
    case 'update':
      return emitRequest.json(data);
    case 'delete':
      return emitRequest;
    default:
      throw new Error('method not supported');
  }
};

/**
 * Emits a request
 * @param {string} method: GET,POST ...
 * @param {string} url
 * @param {object} data
 * @param {*} callback
 */
const emit = (method, url, data, callback) => {
  debugRestHelper('method', method, 'url', url);
  debugRestHelperVerbose('data', data);
  const emitRequest = addMethod(method, url).auth(null, null, true, token);
  addData(emitRequest, method, data)
    .on('response', (res) => {
      if (res.statusCode === 200) {
        data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          let err;
          try {
            data = data.toString();
            if (data.charAt(0) === '<') {
              return callback(`Response is an html page => forwarded ${url}, ${method.toUpperCase()}`);
            } // html page
            debugRestHelperVerbose('Reponse', data);
            data = JSON.parse(data);
          } catch (error) {
            err = error;
            dumpError(err);
            debugRestHelperVerbose('Reponse', data);
            debugRestHelperVerbose('data.charAt(0)', data.charAt(0));
            return callback(`Response invalid ${err}}, ${url}, ${method.toUpperCase()}`);
          }

          if ((data == null) || (data === '')) {
            return callback(`No response ${url}, ${method.toUpperCase()}`);
          }
          if (data.err) {
            return callback(data.err);
          }
          return callback(null, data);
        });
      } else {
        logger.warn(`Error: ${res.statusCode}, ${url}, ${method.toUpperCase()}`, {data});
        return callback(`Error: ${res.statusCode}, ${url}, ${method.toUpperCase()}`);
      }
    })
    .on('error', (err) => {
      logger.warn(`Error no connection ${url}, ${method.toUpperCase()}`, {err});
      return callback(`Error no connection ${url}, ${method.toUpperCase()}`);
    });
};
module.exports = {bsonToJson, emit};
