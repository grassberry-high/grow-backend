'use strict';
const debugBootSensitive = require('debug')('boot:sensitive');
if (!process.env.MONGODB_URL) {
  console.log('Please set MongoDBUrl');
  process.exit(1);
}
const mongoDBUri = process.env.MONGODB_URL;
const Promise = require('bluebird');
Promise.config({
  cancellation: true,
  longStackTraces: true,
  warnings: {
    wForgottenReturn: false,
  },
});

// launch db
module.exports = (mongoose, callback) => {
  debugBootSensitive('Connecting to DB URL', encodeURI(mongoDBUri));
  mongoose.Promise = Promise;
  mongoose.set('error', true);
  mongoose.set('useFindAndModify', false);
  mongoose.set('useCreateIndex', true);
  const connectOptions = {useNewUrlParser: true};
  const db = mongoose.connect(encodeURI(mongoDBUri), connectOptions, (err) => {
    if (err) return callback(err);
    return callback(null, db);
  });
};
