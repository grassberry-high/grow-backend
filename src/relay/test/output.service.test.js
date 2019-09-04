'use strict';
const root = '../../';
const path = require('path');
require('dotenv').config({path: path.join(__dirname, root, '../mocha/.test.env')});
require('debug').enable(process.env.DEBUG);
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const moment = require('moment');
const proxyquire = require('proxyquire').noCallThru();

const {RelayModel} = require('../../relay/relay.model');
const RelayControllerMock = require(root + '/relay/relay-controller/mocks/relay-controller.class.mock.js');

const relayDummies = require(root + '/relay/test/relay.dummies.json');

const loggerServiceStub = require('../../_logger/logger').getStub();
const seedService = proxyquire(root + '/seed/seed.js', {'../_logger/logger.js': loggerServiceStub});
const relayService = proxyquire(root + '/relay/relay.service.js', {'./relay-controller/mocks/relay-controller.class.mock.js': RelayControllerMock});

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  OUPUT SERVICE FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
  before(async() => {
    await RelayModel.deleteMany({});
    await RelayModel.insertMany(relayDummies);
  });

  it('should be able to block an relay', function(done) {
    const stub = sinon.stub(relayService, 'getRelayById').callsFake((id, callback) => callback(null, {_id: 'someId'}));
    relayService.blockRelay('someId', 10, function(err, relay) {
      expect(err).to.equal(null);
      expect(moment(relay.blockedTill).diff(moment(), 'minutes')).to.equal(9);
      sinon.assert.calledOnce(stub);
      stub.restore();
      done();
    });
  });
});
