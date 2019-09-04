'use strict';
const root = '../../';
const path = require('path');
require('dotenv').config({path: path.join(__dirname, root, '../mocha/.test.env')});
require('debug').enable(process.env.DEBUG);
const chai = require('chai');
const expect = chai.expect;
const mkdirp = require('mkdirp');
const fs = require('fs');
const proxyquire = require('proxyquire').noCallThru();

const loggerServiceStub = require('../../_logger/logger').getStub();

const restHelperStub = {};
const shellServiceStub = {};
shellServiceStub.mongoDump = (callback) => callback(null, 'RESULT');
shellServiceStub.getSerial = (callback) => callback(null, '123456789');
shellServiceStub.zipLogs = (callback) => fs.writeFile(path.join(__dirname, root, '../logs/logs.tar.gz'), 'Hello Node.js', (err) => callback(err));
restHelperStub.emit = (method, url, data, callback) => callback(null);
const systemSupport = proxyquire(root + '/system/system.support.js', {
  '../shell/shell.service.js': shellServiceStub,
  '../_api/rest.helper.js': restHelperStub,
});

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  SYSTEM SUPPORT FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
  before((done) =>
    mkdirp(root + '/../logs', function(err) {
      if (err) {
        throw err;
      }
      done();
    })
  );

  it('should be able to send support request', function(done) {
    const options = {};
    systemSupport.sendLogs(options, function(err) {
      expect(err).to.equal(null);
      done();
    });
  });
});
