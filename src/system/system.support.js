'use strict';
const {APP_PATH} = process.env;

const {inspect} = require('util');
const debug = require('debug');

const debugSystemSupport = debug('system:support');

const async = require('async');
const fs = require('fs');
// archiver = require('archiver')
// streamBuffers = require('stream-buffers')

const apiEndpointsModule = require('../_api/api-endpoints.js');

const apiEndpoints = apiEndpointsModule();
const {mongoDump, getSerial, zipLogs} = require('../shell/shell.service.js');
const {emit} = require('../_api/rest.helper.js');

// readLogs = (callback)->

//   input = fs.createReadStream("../../logs/test")

//   input.on 'error', (err) ->
//     return callback err

//   relay = new streamBuffers.WritableStreamBuffer()

//   relay.on 'close', () ->
//     console.log(archive.pointer() + ' total bytes')
//     console.log('archiver has been finalized and the relay file descriptor has closed.')

//   relay.on 'end', () ->
//     console.log('Data has been drained')
//     return callback null, relay

//   relay.on 'error', (err) ->
//     return callback err

//   input.pipe relay
//   input.pipe null

exports.sendLogs = (options, callback) => {
  if (!process.env.APP_PATH) {
    return callback('APP_PATH not configured operation not possible');
  }
  const logZipPath = `${APP_PATH}/logs/logs.tar.gz`;
  async.waterfall([
    (next) => mongoDump(next),
    (status, next) => {
      debugSystemSupport('Created mongodump: ', inspect(status));
      getSerial(next);
    },
    (serial, next) => {
      debugSystemSupport('Serial: ', serial);
      zipLogs((err) => {
        if (err) {
          return next(err);
        }
        next(null, serial);
      });
    },
    (serial, next) =>
      fs.stat(logZipPath, (err, stats) => {
        if (err) {
          debugSystemSupport(`Could not retrieve logs from: ${logZipPath}`, err);
          return next(err);
        }
        debugSystemSupport(`Logs are: ${stats.size / 1000000.0} mb`);
        next(null, serial);
      }),
    (serial, next) =>
      fs.readFile(logZipPath, (err, buffer) => {
        debugSystemSupport('Zipped logs');
        next(err, serial, buffer);
      }),
    (serial, logs, next) => {
      const method = 'POST';
      const url = `${apiEndpoints['support']}/${serial}`;
      const data = {logs};
      debugSystemSupport(`Sending logs for serial ${serial}`);
      emit(method, url, data, next);
    },
  ], callback);
};
