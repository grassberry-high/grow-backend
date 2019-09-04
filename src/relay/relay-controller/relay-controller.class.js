'use strict';
const RELAIS_CONTROLLER_ADDRESS = 0x20;
// const BUS = 1;
const GPIO_REGISTER_ADDRESS = 0x09;
const IODIR_REGISTER_ADDRESS = 0x00;
const CMD_SWITCH_ON = 0x01;
// const CMD_SWITCH_OFF = 0x00;
// https://s3.amazonaws.com/controleverything.media/controleverything/Production%20Run%208/17_MCP23008_I2CR820/Mechanical/17_MCP23008_I2CR820_A.jpgƒ√

// const RELAIS_I = 0x01;
// const RELAIS_II = 0x02;
// const RELAIS_III = 0x03;
// const RELAIS_IV = 0x04;
// const RELAIS_V = 0x05;
// const RELAIS_VI = 0x06;
// const RELAIS_VII = 0x07;
// const RELAIS_VIII = 0x08;


const debugRelay = require('debug')('relay:relay');

const {logger} = require('../../_logger/logger.js');
const {getI2cBus} = require('../../i2c/i2c');

/**
 * Switches relays on/off
 */
class RelayController {
  /**
   * Constructor of relay controller
   */
  constructor() {
    this.i2c1 = getI2cBus();
    this.currentState = 0x00;
    this.address = RELAIS_CONTROLLER_ADDRESS;
    if (process.env.RELAIS_MAPPING) {
      this.addressMapping = process.env.RELAIS_MAPPING.split(',').map((entry) => parseInt(entry));
      debugRelay('Using custom address mapping', this.addressMapping);
    } else {
      this.addressMapping = [8, 6, 4, 2, 7, 5, 3, 1]; // relay are position diff. to outlets
    }
    this.bootRelayController((err) => {
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
  bootRelayController(callback) {
    if (!this.i2c1) {
      return callback('I2c not booted');
    }
    // console.error "WRITNG: RELAIS_CONTROLLER_ADDRESS #{RELAIS_CONTROLLER_ADDRESS} #{typeof RELAIS_CONTROLLER_ADDRESS} IODIR_REGISTER_ADDRESS #{IODIR_REGISTER_ADDRESS} #{typeof IODIR_REGISTER_ADDRESS} 0x00"
    this.i2c1.writeByte(RELAIS_CONTROLLER_ADDRESS, IODIR_REGISTER_ADDRESS, 0x00, (err) => {
      if (err) {
        return callback(err);
      }
      return callback();
    });
  }

  /**
   * Switch a relay
   * @param {number} command
   * @param {number} address
   * @param {*} callback
   * @return {*}
   */
  switchRelay(command, address, callback) {
    const self = this;
    debugRelay(`MAPPED ${address} => ${this.addressMapping[address - 1]}`);
    address = this.addressMapping[address - 1];
    // 1 = R1, 2 = R2, 4 = R3, R1+R2+R3 = 7
    const amount = Math.pow(2, address - 1);
    debugRelay(`state ${this.currentState} address ${address} 2^${address - 1} = amount ${amount}`);

    if (command === CMD_SWITCH_ON) {
      debugRelay('SWITCH ON');
      this.currentState += amount;
    } else {
      debugRelay('SWITCH OFF');
      this.currentState -= amount;
    }

    debugRelay(`NEW STATE ${this.currentState}`);
    if (this.i2c1) {
      debugRelay(`SWITCHING I2C ${command} RELAIS ${self.currentState} \n\n`);
      this.i2c1.writeByte(RELAIS_CONTROLLER_ADDRESS, GPIO_REGISTER_ADDRESS, self.currentState, (err) => {
        if (err) {
          return callback(err);
        }
        return callback();
      });
    } else {
      return callback('I2C not booted');
    }
  }
}
module.exports = RelayController;
