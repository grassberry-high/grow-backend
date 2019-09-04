'use strict';
const mongoose = require('mongoose');
module.exports = async function() {
  await global.__MONGOD__.stop();
  await mongoose.connection.close();
};
