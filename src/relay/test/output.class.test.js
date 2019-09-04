'use strict';
const root = '../..';
const path = require('path');
require('dotenv').config({path: path.join(__dirname, root, '../mocha/.test.env')});
require('debug').enable(process.env.DEBUG);
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const {RelayModel} = require('../../relay/relay.model');

const sensorDummies = require(root + '/sensor/test/sensor.dummies.json');
const relayDummies = require(root + '/relay/test/relay.dummies.json');
const socketIoMessengerStub = {};
socketIoMessengerStub.sendMessage = sinon.stub().callsFake((recipient, message) =>{
});
const DataLoggerMock = require(root + '/data-logger/mocks/data-logger.class.mock.js');
const RelayControllerMock = require(root + '/relay/relay-controller/mocks/relay-controller.class.mock.js');
const RelayClass = proxyquire(root + '/relay/relay.class.js', {
  '../_socket-io/socket-io-messenger.js': socketIoMessengerStub,
  '../data-logger/data-logger.class.js': DataLoggerMock,
});

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  OUPUT FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function () {
  describe('>>>>>>>>>>>>>>>>>>>>>>>>>  CHAMBER FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function () {
    before(async () => {
      await RelayModel.deleteMany({});
      await RelayModel.insertMany(relayDummies);
    });

    let relay = null;
    beforeEach(function () {
      const relayOptions = relayDummies[0];
      relayOptions.relayController = new RelayControllerMock();
      relay = new RelayClass(relayOptions);
      socketIoMessengerStub.sendMessage.resetHistory();
    });

    it('should be able to switch an relay on', function (done) {
      const stubRelay = sinon.stub(relay, 'broadcastRelay');
      const stubEvent = sinon.stub(relay, 'createEvent').callsFake((a, b, callback) => callback(null));
      const detectorId = sensorDummies[0].detectors[0]._id;
      const info = 'unit test';
      relay.switchOn(info, detectorId, function (err) {
        expect(err).to.be.null;
        sinon.assert.calledOnce(stubRelay);
        sinon.assert.calledOnce(stubEvent);
        stubRelay.restore();
        stubEvent.restore();
        done();
      });
    });

    it('should be able to switch an relay off', function (done) {
      relay.state = 1; // on
      const stubRelay = sinon.stub(relay, 'broadcastRelay');
      const stubEvent = sinon.stub(relay, 'createEvent').callsFake((a, b, callback) => callback(null));
      const detectorId = sensorDummies[0].detectors[0]._id;
      const info = 'unit test';
      relay.switchOff(info, detectorId, function (err) {
        expect(err).to.be.null;
        sinon.assert.calledOnce(stubRelay);
        sinon.assert.calledOnce(stubEvent);
        stubRelay.restore();
        stubEvent.restore();
        done();
      });
    });

    it('should not try to switch an relay off which is already off', function (done) {
      relay.state = 0; // off
      const stubRelay = sinon.stub(relay, 'broadcastRelay');
      const stubEvent = sinon.stub(relay, 'createEvent').callsFake((a, b, callback) => callback(null));
      const detectorId = sensorDummies[0].detectors[0]._id;
      const info = 'unit test';
      relay.switchOff(info, detectorId, function (err) {
        expect(err).to.be.null;
        sinon.assert.notCalled(stubRelay);
        sinon.assert.notCalled(stubEvent);
        stubRelay.restore();
        stubEvent.restore();
        done();
      });
    });

    it('should broadcast the current relay', function () {
      relay.broadcastRelay();
      sinon.assert.calledOnce(socketIoMessengerStub.sendMessage);
    });
  });
});
