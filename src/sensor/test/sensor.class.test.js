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

const {SensorModel} = require('../../sensor/sensor.model');
const {SensorDataModel} = require('../../data-logger/sensor-data.model');

const sensorDummies = require('./sensor.dummies.json');
const sensorDataDummies = require('../../data-logger/test/sensor-data.dummies');
const rulesDummies = require(root + '/rule/test/rule.dummies.json');
const relayServiceStub = {};
relayServiceStub.operateRelay = sinon.stub();
const ruleServiceStub = {};
const socketIoMessengerStub = {};
ruleServiceStub.getRules = sinon.stub();
socketIoMessengerStub.sendMessage = sinon.stub();
ruleServiceStub.getRules = function(options, callback) {
  const rules = [{_id: '123'}];
  callback(null, rules);
};

relayServiceStub.getRelayById = function(id, callback) {
  const relay = {
    name: 'dummyRelay',
    state: 0,
  };
  callback(null, relay);
};
const SensorClass = proxyquire(root + '/sensor/sensor.class.js', {
  '../relay/relay.service.js': relayServiceStub,
  '../rule/rule.service.js': ruleServiceStub,
  '../_socket-io/socket-io-messenger.js': socketIoMessengerStub,
});

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  SENSOR FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
  before(async () => {
    await SensorModel.deleteMany({});
    await SensorModel.insertMany(sensorDummies);
    await SensorDataModel.deleteMany({});
    await SensorDataModel.insertMany(sensorDataDummies);
  });


  describe('>>>>>>>>>>>>>>>>>>>>>>>>>  SENSOR PROCESS, WRITE & BROADCAST  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
    let sensor = null;
    beforeEach(function (next) {
      sensor = new SensorClass(sensorDummies[0], next);
      socketIoMessengerStub.sendMessage.resetHistory();
    });

    it('should be able to get the sensor', function() {
      const receivedSensor = sensor.getSensor();
      expect(receivedSensor._id).to.equal('588a427d617fff11d79b3049');
    });

    it('check write should be true if not blocked', function() {
      const detector = {
        lastWrite: null,
      };
      const checkWrite = sensor.checkWrite(detector);
      expect(checkWrite).to.equal(true);
    });

    it('check write should be true if exceeded blocked', function() {
      const detector = {
        lastWrite: moment().subtract(2 * sensor.sensorWriteIntervall),
      };
      const checkWrite = sensor.checkWrite(detector);
      expect(checkWrite).to.equal(true);
    });

    it('check write should be false if blocked', function() {
      const detector = {
        lastWrite: moment().subtract(0.8 * sensor.sensorWriteIntervall),
      };
      const checkWrite = sensor.checkWrite(detector);
      expect(checkWrite).to.equal(false);
    });

    it('check push should be true if not blocked', function() {
      const detector = {
        lastPush: null,
      };
      const checkPush = sensor.checkPush(detector);
      expect(checkPush).to.equal(true);
    });

    it('check push should be true if exceeded blocked', function() {
      const detector = {
        lastPush: moment().subtract(2 * sensor.sensorPushIntervall),
      };
      const checkPush = sensor.checkPush(detector);
      expect(checkPush).to.equal(true);
    });

    it('check push should be false if blocked', function() {
      const detector = {
        lastPush: moment().subtract(0.8 * sensor.sensorPushIntervall),
      };
      const checkPush = sensor.checkPush(detector);
      expect(checkPush).to.equal(false);
    });

    it('should change the sensors time unit', (done) =>
      sensor.changeSensorTimeUnit('minutes', function(err, receivedSensor) {
        expect(err).to.equal(null);
        if (receivedSensor) {
          expect(receivedSensor._id).to.equal('588a427d617fff11d79b3049');
          expect(receivedSensor.sensorPushIntervall).to.equal(60000); // 1min in ms
        } else {
          expect(receivedSensor).to.equalDefined();
        }
        done();
      })
    );

    it('should broadcast the current sensor history', function() {
      sensor.broadcastSensorHistory();
      sinon.assert.calledOnce(socketIoMessengerStub.sendMessage);
    });

    it('should normalize sensor values to buffer swings', function() {
      const detector = {shortBuffer: [1, 1, 1, 1, 1]};
      const value = 10;
      const adjustedValue = sensor.adjustValue(detector, value);
      expect(adjustedValue).to.equal(2.5);
    });

    it('should process a sensor value', function(done) {
      const stubAdjust = sinon.stub(sensor, 'adjustValue').returns(24);
      const stubRules = sinon.stub(sensor, 'applyRules');
      const stubSensor = sinon.stub(sensor, 'sensorSaveValueToDb').callsFake((a, b, callback) => callback());
      const newValue = 24;
      const detector = {history: []};
      sensor.processSensorValue(detector, newValue, function(err) {
        expect(err).to.equal(null);
        expect(detector.history.pop()['y']).to.equal(newValue);
        expect(detector.currentValue['y']).to.equal(newValue);
        sinon.assert.calledOnce(stubAdjust);
        sinon.assert.calledOnce(stubRules);
        sinon.assert.calledOnce(stubSensor);
        stubAdjust.restore();
        stubRules.restore();
        stubSensor.restore();
        done();
      });
    });
  });


  describe('>>>>>>>>>>>>>>>>>>>>>>>>>  SENSOR READ  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
    let sensor = null;
    let data = [];
    beforeEach(function(next) {
      sensor = new SensorClass(sensorDummies[0], next);
      data = [
        {timestamp: moment().subtract(0.5, 'hours'), value: 10},
        {timestamp: moment().subtract(0.5, 'minutes'), value: 10},
        {timestamp: moment().subtract(0.5, 'seconds'), value: 10},
      ];
    });


    it('should filter history, minimum step seconds', function(done) {
      sensor.timeUnit = 'seconds';
      sensor.filterSensorHistory(data, function(err, filteredData) {
        expect(filteredData.length).to.equal(3);
        done();
      });
    });

    it('should filter history, minimum step minutes', function(done) {
      sensor.timeUnit = 'minutes';
      sensor.filterSensorHistory(data, function(err, filteredData) {
        expect(filteredData.length).to.equal(2);
        done();
      });
    });

    it('should filter history, minimum step hours', function(done) {
      sensor.timeUnit = 'hours';
      sensor.filterSensorHistory(data, function(err, filteredData) {
        expect(filteredData.length).to.equal(1);
        done();
      });
    });


    it('should read the sensor\'s history', function(done) {
      const detector = {
        type: 'temperature',
      };
      sensor.readSensorHistory(detector, function(err, filteredData) {
        expect(filteredData.length).to.equal(1);
        done();
      });
    });
  });

  describe('>>>>>>>>>>>>>>>>>>>>>>>>>  SENSOR INIT APPLY  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', function() {
    let sensor = null;
    beforeEach((next) => sensor = new SensorClass(sensorDummies[0], next));
    beforeEach( () => {
      relayServiceStub.operateRelay.resetHistory();
    });

    it('should init the sensor', function() {
      const detector = {};
      sensor.initRules(detector);
      expect(detector.rules.length).to.equal(1);
    });

    it('should apply the sensor\'s rules if it is above onValue and relay is off (on > off)', function(done) {
      const detector = {
        currentValue: {y: 32},
        rules: [rulesDummies[1]],
      };
      console.log(sensor);
      sensor.applyRules(detector);
      setTimeout( () => {
        sinon.assert.calledOnce(relayServiceStub.operateRelay);
        done();
      }, 0);
    });

    it('should NOT apply the sensor\'s rules if is NOT above onValue', function(done) {
      const detector = {
        currentValue: {y: 28},
        rules: [rulesDummies[1]],
      };
      sensor.applyRules(detector);
      setTimeout( () => {
        sinon.assert.notCalled(relayServiceStub.operateRelay);
        done();
      }, 0);
    });
    it('should apply the sensor\'s rules if it is below onValue and relay is off (on < off)', function(done) {
      const detector = {
        currentValue: {y: 9},
        rules: [rulesDummies[2]],
      };
      sensor.applyRules(detector);
      setTimeout( () => {
        sinon.assert.calledOnce(relayServiceStub.operateRelay);
        done();
      }, 0);
    });

    it('should NOT apply the sensor\'s rules if it is NOT below onValue (on < off)', function(done) {
      const detector = {
        currentValue: {y: 11},
        rules: [rulesDummies[2]],
      };
      sensor.applyRules(detector);
      setTimeout( () => {
        sinon.assert.notCalled(relayServiceStub.operateRelay);
        done();
      }, 0);
    });
  });
});
