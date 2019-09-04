'use strict';
const Relay = require('../relay.class.js');

/**
 * Mock of relay class: a single relay of the relay controller
 */
class RelayMock extends Relay {
  /**
   * Relay mock constructor
   * @param {object} options -id, label, name, address, relayController (_id)
   */
  constructor(options) {
    super(options);
  }

  /**
   * Log a relay event with dataLogger
   * @param {string} state
   * @param {string} info
   * @param {*} callback
   * @return {*}
   */
  createEvent(state, info, callback) {
    return callback();
  }

  /**
   * Switch on a relay
   * @param {string} info
   * @param {object} detectorId
   * @param {*} callback
   * @return {*}
   */
  switchOn(info, detectorId, callback) {
    return callback();
  }

  /**
   * Switch off a relay
   * @param {string} info
   * @param {object} detectorId
   * @param {*} callback
   * @return {*}
   */
  switchOff(info, detectorId, callback) {
    return callback();
  }

  /**
   * Broadcast relay data
   */
  broadcastRelay() {
  }
}
module.exports = RelayMock;
