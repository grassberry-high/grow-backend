'use strict';
const root = '../../';
const path = require('path');
require('dotenv').config({path: path.join(__dirname, root, '../mocha/.test.env')});
require('debug').enable(process.env.DEBUG);
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;
const {ChamberModel} = require('../../chamber/chamber.model');
const {RelayModel} = require('../../relay/relay.model');
const {SensorModel} = require('../../sensor/sensor.model');
const {RuleModel} = require('../../rule/rule.model');
const {CronjobModel} = require('../../cronjob/cronjob.model');

const OUTPUT_OFF = 0;

const chamberDummies = require('./chamber.dummies');
const relayDummies = require('../../relay/test/relay.dummies');
const sensorDummies = require('../../sensor/test/sensor.dummies');
const ruleDummies = require('../../rule/test/rule.dummies');
const cronjobDummies = require('../../cronjob/test/cronjob.dummies');

const relayServiceStub = {};
const ruleServiceStub = {};
const cronJobServiceStub = {};
const relayAndSensorBootHelperStub = {};
const i2cServiceMock = require(root + '/i2c/mocks/i2c.mock.js');

relayServiceStub.getRelayState = () => OUTPUT_OFF;
ruleServiceStub.upsertRule = sinon.stub().callsFake((rule, callback) => {
  const upsertedRule = {_id: new ObjectId('588a427d617fff11d79b3054')};
  callback(null, upsertedRule);
});
cronJobServiceStub.removeCronjobs = function(cronjobs) {
};
cronJobServiceStub.createCronjob = (createCronjob, callback) => callback(null, {_id: createCronjob._id});
relayAndSensorBootHelperStub.bootSensorsAndRelays = (bootOptions, callback) => callback(null);

const mochaHelper = require('../../_helper/mocha.helper');
const chamberService = proxyquire(root + '/chamber/chamber.service.js', {
  '../relay/relay.service.js': relayServiceStub,
  '../rule/rule.service.js': ruleServiceStub,
  '../cronjob/cronjob.service.js': cronJobServiceStub,
  '../i2c/i2c.js': i2cServiceMock,
  '../_helper/ouputAndSensorBoot.helper.js': relayAndSensorBootHelperStub,
});

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  CHAMBER FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
  before(async () => {
    await ChamberModel.deleteMany({});
    await ChamberModel.insertMany(chamberDummies.upsertMainBox);
    await RelayModel.deleteMany({});
    await RelayModel.insertMany(relayDummies);
    await SensorModel.deleteMany({});
    await SensorModel.insertMany(sensorDummies);
    await RuleModel.deleteMany({});
    await RuleModel.insertMany(ruleDummies);
    await CronjobModel.deleteMany({});
    await CronjobModel.insertMany(cronjobDummies);
  });

  beforeEach(function() {
    ruleServiceStub.upsertRule.resetHistory();
  });

  it('should be able to get the chambers and add allRelays and allSensors', function(done) {
    const options = {lean: true, populate: {all: true}};
    chamberService.getChambers(options, function(err, chambers) {
      expect(err).to.equal(null);
      chambers = mochaHelper.normalizeMongoose(chambers);
      expect(chambers).deep.equal(chamberDummies.getChambers);
      done();
    });
  });

  it('should be able to upsert an existing chamber', function(done) {
    const chamber = chamberDummies.upsertMainBox;

    chamberService.upsertChamber(chamber, function(err, upsertedChamber) {
      expect(err).to.equal(null);
      debugger;
      upsertedChamber = mochaHelper.normalizeMongoose(upsertedChamber);
      debugger;
      sinon.assert.calledThrice(ruleServiceStub.upsertRule);
      expect(upsertedChamber).deep.equal(chamberDummies.upsertedMainBox);
      done();
    });
  });
});
