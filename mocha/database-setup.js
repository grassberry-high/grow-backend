'use strict';
// setup.js
require('dotenv').config( {path: './.test.env'});
require('debug').enable(process.env.DEBUG);
const debugMocha = require('debug')('mocha');
const path = require('path');

const fs = require('fs');

const {MongoMemoryServer} = require('mongodb-memory-server');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const globalConfigPath = path.join(__dirname, 'test-config.json');

const mongod = new MongoMemoryServer({
  autoStart: false,
  useNewUrlParser: true,
  // , debug: true
});

const launchDB = async () => {
  debugMocha('Launching test DB');
  if (mongoose.connection.readyState === 1) {
    return;
  }
  mongoose.connection.on('error', function(err) {
    console.error('MongoDB error: %s', err);
  });

  if (!mongod.isRunning) {
    await mongod.start();
  }

  const mongoConfig = {
    mongoDBName: 'gbh-mocha-test',
    mongoUri: await mongod.getConnectionString(),
  };

  // Write global config to disk because all tests run in different contexts.
  debugMocha('globalConfigPath', globalConfigPath, 'mongoConfig', mongoConfig);
  fs.writeFileSync(globalConfigPath, JSON.stringify(mongoConfig));

  // Set reference to mongod in order to close the server during teardown.
  global.__MONGOD__ = mongod;

  // Connect mongoose
  const mongooseOpts = {// options for mongoose 4.11.3 and above
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    useNewUrlParser: true,
  };
  mongoose.set('useFindAndModify', false);
  mongoose.set('useCreateIndex', true);
  mongoose.connection.on('error', (e) => {
    if (e.message.code === 'ETIMEDOUT') {
      console.log(e);
      mongoose.connect(mongoConfig.mongoUri, mongooseOpts);
    }
    console.log(e);
  });

  mongoose.connection.once('open', () => {
    console.log(`MongoDB successfully connected to ${mongoConfig.mongoUri}`);
  });
  await mongoose.connect(mongoConfig.mongoUri, mongooseOpts);
};
before(async function() {
  // eslint-disable-next-line no-invalid-this
  const timeoutTemp = this.timeout();
  // eslint-disable-next-line no-invalid-this
  this.timeout(15000);
  debugMocha('before DB launch');
  await launchDB();
  // eslint-disable-next-line no-invalid-this
  this.timeout(timeoutTemp);
});
