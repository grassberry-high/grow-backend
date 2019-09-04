'use strict';
const root = '../../';
const path = require('path');
require('dotenv').config({path: path.join(__dirname, root, '../mocha/.test.env')});
require('debug').enable(process.env.DEBUG);
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const moment = require('moment');

const {RelayModel} = require('../../relay/relay.model');
const {CronjobModel} = require('../../cronjob/cronjob.model');

const dummies = require(root + '/_spec-helpers/dummies.js');
const cronjobDummies = dummies.cronjobDummies();
const relayDummies = require('../../relay/test/relay.dummies');

const relayServiceStub = {};
relayServiceStub.operateRelay = sinon.stub().callsFake( (relayId, action, info, detectorId, callback) => callback(null));
const cronjobService = proxyquire(root + '/cronjob/cronjob.service.js', {'../relay/relay.service': relayServiceStub});

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  CRONJOB FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
  before(async () => {
    await RelayModel.deleteMany({});
    await RelayModel.insertMany(relayDummies);
    await CronjobModel.deleteMany({});
    await CronjobModel.insertMany(cronjobDummies);
  });

  beforeEach( () => {
    relayServiceStub.operateRelay.resetHistory();
  });

  it('should be able to check cronjobs bootstatus and switch relay I on', function() {
    const expectedRelayId = cronjobDummies[0].relay._id.toString();
    const clock = sinon.useFakeTimers({now: moment('2019-01-01T12:12:00.000Z').valueOf()});
    cronjobService.bootStatus(cronjobDummies);
    sinon.assert.calledOnce(relayServiceStub.operateRelay);
    sinon.assert.calledWith(relayServiceStub.operateRelay, expectedRelayId, 'switchOn');
    clock.restore();
  });

  it('should be able to check cronjobs bootstatus and switch relay I off', function() {
    const expectedRelayId = cronjobDummies[0].relay._id.toString();
    const clock = sinon.useFakeTimers({now: moment('2019-01-01T02:12:00.000Z').valueOf()});
    cronjobService.bootStatus(cronjobDummies);
    sinon.assert.calledOnce(relayServiceStub.operateRelay);
    sinon.assert.calledWith(relayServiceStub.operateRelay, expectedRelayId, 'switchOff');
    clock.restore();
  });

  it('should be able to create cronjobs from DB', function(done) {
    const stub = sinon.stub(cronjobService, 'bootStatus').callsFake( () => {
    });
    cronjobService.launchCronjobs(function(err, success) {
      expect(err).to.equal(null);
      expect(success).to.equal(true);
      sinon.assert.calledOnce(stub);
      stub.restore();
      done();
    });
  });


  it('should be able to stop cronjobs', function() {
    cronjobService.stopCronjobs();
    expect(cronjobService.getActiveCronjobs().length).to.equal(0);
  });
});
