'use strict';
const chalk = require('chalk');
const moment = require('moment');
const {createLogger, format, transports} = require('winston');
const mkdirp = require('mkdirp');
const blocked = require('blocked');
const environment = process.env.NODE_ENV;

require('winston-mongodb').MongoDB;

let logger = null;
const mongoDBUri = encodeURI(process.env.MONGODB_URL);


/**
 * Launches a logger
 * @param {*} callback: fn(err, logger)
 * @return {*}
 */
const launchLogger = (callback) => {
  mkdirp('logs/gh', (err) => {
    if (err) {
      console.log(err);
    }
  });

  const filterArray = format((info, opts) => {
    if (info.meta && info.meta.data && info.meta.data.length) {
      info.meta.data = [`Stripped Array length ${info.meta.data.length}`];
    }
    return info;
  });

  logger = createLogger({
    level: 'error',
    exitOnError: false,
    format: format.combine(
      filterArray(),
      format.json()
    ),
    transports: [
      new transports.Console({
        label: 'consoleLogger',
        level: 'debug',
        json: false,
        colorize: true,
      }),
    ],
  });

  logger.stream = {
    write(message) {
      return logger.info(message);
    },
  };

  logger.on('logging', (transport, level, message, meta) => {
    const timestamp = moment().toISOString();
    // console.log "[#{message}] and [#{JSON.stringify(meta)}] have now been logged (#{transport.label}) at level: [#{level}] at #{timestamp}"
    if (transport.label === 'mongoLogger') {
      if (level === 'info') {
        socketIoMessenger.sendLog('userLog', {
          'message': message,
          'level': level,
          'meta': meta,
          'timestamp': timestamp,
        });
        socketIoMessenger.sendLog('adminLog', {
          'message': message,
          'level': level,
          'meta': meta,
          'timestamp': timestamp,
        });
      } else {
        socketIoMessenger.sendLog('adminLog', {
          'message': message,
          'level': level,
          'meta': meta,
          'timestamp': timestamp,
        });
      }
    }
    if ((level === 'error') && (environment === 'production')) { // send err to ordermed
      const errorMessage = errorMessageService.buildErrorMsg(message);
      const recipient = null;

      if (!process.env.MUTE_MAILER_ERR === 'true') {
        mailer(environment, recipient, 'VSS Error', errorMessage.plainText, errorMessage.htmlText, (err) => {
          if (err) {
            throw err;
          }
        });
      }
    }
  });

  blocked((ms) => {
    if (ms > 10000) {
      logger.error(`Event Loop was blocked for ${ms}`);
    } else {
      logger.warn(`Event Loop was blocked for ${ms}`);
    }
  }, {threshold: 1000});
  return callback(null, logger);
};

const addMongoDBTransport = (callback) => {
  logger.add(new transports.MongoDB({
    label: 'mongoLogger',
    level: 'silly',
    db: mongoDBUri,
    collection: 'serverlogs',
    handleExceptions: false,
    colorize: false,
    timestamp: true,
  }));
  return callback(null, logger);
};

/**
 * Get a fake logger (to console vs to DB)
 * @return {object} fakeLogger
 */
const getStub = () => ({
  silly(msg) {
    console.log(chalk.blue(`blue: ${msg}`));
  },
  info(msg) {
    console.log(chalk.green(`info: ${msg}`));
  },
  warn(msg) {
    console.log(chalk.yellow(`warn: ${msg}`));
  },
  error(msg) {
    console.log(chalk.red(`error: ${msg}`));
  },
  debug(msg) {
    console.log(chalk.magenta(`debug: ${msg}`));
  },
});

launchLogger((err) => {
  if (err) {
    throw new Error(err);
  }
});


module.exports = {logger, launchLogger, getStub, addMongoDBTransport};
