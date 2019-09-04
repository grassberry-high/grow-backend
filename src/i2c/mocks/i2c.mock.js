'use strict';
// const MHZ16 = 77;
//
// // mhz16
// const IOCONTROL = 0x0e << 3;
// const FCR = 0x02 << 3;
// const LCR = 0x03 << 3;
// const DLL = 0x00 << 3;
// const DLH = 0x01 << 3;
// const THR = 0x00 << 3;
// const RHR = 0x00 << 3;
const TxLVL = 0x08 << 3;
const RxLVL = 0x09 << 3;

const open = (bus, callback) => {
  bus = {
    scan(callback) {
      const devices = [64, 77, 32, 33]; // humidty/temp, co2, relay controller
      return callback(null, devices);
    },

    readByte(address, command, callback) {
      let bytes;
      if (address === 77) {
        switch (command) {
          case TxLVL:
            bytes = 9;
            break;
          case RxLVL:
            bytes = 9;
            break;
          default:
            bytes = 0;
        }
        return callback(null, bytes);
      } else {
        bytes = 0;
        return callback(null, bytes);
      }
    },

    writeByte(address, register, byte, callback) {
      return callback(null);
    },

    sendByte(address, byte, callback) {
      return callback(null);
    },

    receiveByte(address, callback) {
      return setTimeout(() => callback(null, 0)
        , 500);
    },

    writeI2cBlock(address, register, blockLength, block, callback) {
      const buffer = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      return callback(null, buffer.length, buffer);
    },

    readI2cBlock(address, register, readLength, readBuffer, callback) {
      readBuffer = Buffer.from([0xff, 0x9c, 0x00, 0x00, 0x05, 0x08, 0x00, 0x00, 0x57]);
      return callback(null);
    },
  };
  setTimeout(callback, 500);
  return bus;
};

const adressInActiveDevices = (address) => true;

const checkDifference = (callback) => {
  const differenceLost = [];
  const differenceAdded = [];
  return callback(null, {differenceLost, differenceAdded});
};

module.exports = {open, adressInActiveDevices, checkDifference};
