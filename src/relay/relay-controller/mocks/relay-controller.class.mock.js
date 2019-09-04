'use strict';
const RELAIS_CONTROLLER_ADDRESS = 0x20;

const CMD_SWITCH_ON = 0x01;
// const CMD_SWITCH_OFF = 0x00;

const {logger} = require('../../../_logger/logger.js');

/**
 * Mock of relay controller
 */
class RelayControllerMock {
  /**
   * Constructor of relay controller mock
   */
  constructor() {
    this.currentState = 0x00;
    this.address = RELAIS_CONTROLLER_ADDRESS;
    RelayControllerMock.bootRelayController((err) => {
      if (err) {
        return logger.error;
      }
    });
  }

  /**
   * Boot the relay controller
   * @param {object} callback
   * @return {*}
   */
  static bootRelayController(callback) {
    return callback();
  }

  /**
   * Switch a relay
   * @param {number} command
   * @param {number} address
   * @param {*} callback
   */
  switchRelay(command, address, callback) {
    const amount = Math.pow(2, address - 1);
    if (command === CMD_SWITCH_ON) {
      console.log('SWITCH ON');
      this.currentState += amount;
    } else {
      console.log('SWITCH OFF');
      this.currentState -= amount;
    }

    console.log(`NEW STATE ${this.currentState}`);

    callback();
  }
}
module.exports = RelayControllerMock;
