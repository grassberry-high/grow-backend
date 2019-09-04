'use-strict';
const debugSeed = require('debug')('seed');

const async = require('async');

const userSeed = require('../user/user.seed');
const {seedRelays} = require('../relay/relay.service');
const {seedSensors} = require('../sensor/sensor.service');


const startSeeding = (callback) => {
  async.series([
    (next) => userSeed.seedAdmin(next),
    (next) => {
      if (!process.env.SEED) {
        return next(null, true);
      }

      const toSeed = process.env.SEED.split(',');
      async.each(toSeed, (seed, next) => {
        debugSeed('Seeding', seed);
        switch (seed) {
          case 'sensors':
            seedSensors(next);
            break;
          case 'relays':
            seedRelays(next);
            break;
          default:
            return next(null);
        };
      }, next);
    },
  ], callback);
};

module.exports = {startSeeding};
