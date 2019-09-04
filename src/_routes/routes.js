'use strict';
const express = require('express');

const loginRoutesModule = require('./login.routes');
const developmentRoutesModule = require('./development.routes');
const shellRoutesModule = require('./shell.routes');
const chamberRoutesModule = require('./chamber.routes');
const relayRoutesModule = require('./relay.routes');
const sensorRoutesModule = require('./sensor.routes');
const ruleRoutesModule = require('./rule.routes');
const dataLoggerRoutesModule = require('./data-logger.routes');
const i2cRoutesModule = require('./i2c.routes');
const feedbackRoutesModule = require('./feedback.routes');
const systemRoutesModule = require('./system.routes');
const subscriptionRoutesModule = require('./subscription.routes');
const debugRoutesModule = require('./debug.routes');
const patchRoutesModule = require('./patch.routes');

const routes = (app, passport) => {
  app.use((req, res, next) => {
    if (process.env['NODE_ENV'] === 'development') {
      // Website you wish to allow to connect
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');// angular
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // // Set to true if you need the website to include cookies in the requests sent
    // // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);

    // // Pass to next layer of middleware
    return next();
  });

  // normal routes ===============================================================
  // show the home page
  const path = __dirname + '/../../';
  app.use(express.static(path));
  shellRoutesModule(app);
  developmentRoutesModule(app);
  loginRoutesModule(app, passport);
  chamberRoutesModule(app);
  relayRoutesModule(app);
  sensorRoutesModule(app);
  ruleRoutesModule(app);
  dataLoggerRoutesModule(app);
  i2cRoutesModule(app);
  feedbackRoutesModule(app);
  systemRoutesModule(app);
  subscriptionRoutesModule(app);
  debugRoutesModule(app);
  patchRoutesModule(app);
};

module.exports = routes;
