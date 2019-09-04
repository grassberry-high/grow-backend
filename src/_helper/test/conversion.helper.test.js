'use strict';
const root = '../../';
const path = require('path');
require('dotenv').config({path: path.join(__dirname, root, '../mocha/.test.env')});
require('debug').enable(process.env.DEBUG);
const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire').noCallThru();
const moment = require('moment');

const systemReadStub = {};
systemReadStub.getSystem = (options, callback) => callback(null, {timeZone: 'Europe/Amsterdam'});

const conversionHelper = proxyquire(root + '/_helper/conversion.helper', {'../system/system.read': systemReadStub});

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  CONVERSION HELPER FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
  before((done) => conversionHelper.setTimeZone(done));

  return it('should transform system time to local user time', function() {
    const format = 'YYYY-MM-DD hh:mm';
    const dateTime = moment('2017-10-09T00:00:00.000Z');
    const localTime = conversionHelper.formatTimeToLocalTime(dateTime, format);
    expect(localTime).to.equal('2017-10-09 02:00');
  });
});
