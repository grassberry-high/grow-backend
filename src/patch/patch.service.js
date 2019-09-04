'use strict';
const async = require('async');
const relaySeeds = require('../relay/seed/relays.seed.json');

const addRelays = (callback) => async.eachSeries(relaySeeds, (upsertRelay, next) => upsertRelay(upsertRelay, next), callback);
module.exports = {addRelays};
