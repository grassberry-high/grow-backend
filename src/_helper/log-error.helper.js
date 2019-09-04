'use strict';
const {logger} = require('../_logger/logger.js');

const dumpError = (err) => {
  if (typeof err === 'object') {
    if (err.message) {
      console.log(`\nMessage: ${err.message}`);
    }
    if (err.stack) {
      console.log('\nStacktrace:');
      console.log('====================');
      console.trace(err);
      logger.error(err.stack);
    }
  } else {
    console.log('dumpError :: argument is not an object');
  }
};

module.exports = {dumpError};
