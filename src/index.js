'use strict';
require('dotenv').config();
const debugBoot = require('debug')('boot');
const debugRequests = require('debug')('requests');

if (!process.env.FRONTEND_URL) {
  throw new Error('Frontend url must be set');
}

const async = require('async');
const moment = require('moment');
const fs = require('fs');

let server;
let startProcessTime;

if (process.env.LOG_FOLDER) {
  if (!fs.existsSync(process.env.LOG_FOLDER)) {
    fs.mkdirSync(process.env.LOG_FOLDER, {recursive: true});
  }
}

// app dep
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')();

const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
const bodyParser = require('body-parser');
const passport = require('passport');

const mongoose = require('mongoose');

const {addMongoDBTransport} = require('./_logger/logger');
const {initSocketListener, sendMessage} = require('./_socket-io/socket-io-messenger');
const {bootSensorsAndRelays} = require('./_helper/ouputAndSensorBoot.helper');
const {bootI2C} = require('./i2c/i2c');
const {startSeeding} = require('./seed/seed');
const {getLicenseInformation, bootLicenseCronjob} = require('./system/system.update');
const {setTimeZone, getLocalTime} = require('./_helper/conversion.helper');

// app fn
const setupServer = (callback) => {
  debugBoot(`Setting up Server NODE_ENV ${process.env.NODE_ENV}.`);
  // main app
  const app = express();
  app.set('port', process.env.PORT || 3000);
  const whitelist = ['http://localhost:4200', 'http://localhost:3000', 'https://git-start.com'];
  const corsOptions = {
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
    origin: whitelist,
  };
  // corsOptions.origin = 'http://localhost:4200';
  if (debugRequests.enabled) {
    app.use((req, res, next) => {
      debugRequests('req.path', req.path);
      next();
    });
  }
  app.use(cors(corsOptions));
  app.use(cookieParser);
  if (process.env.STRIPE_WEBHOOK_ENDPOINT) {
    // keep the raw req. for validation
    const stripeRaw = (req, res, buf) => {
      if (req.url === '/core/stripe/webhook/') {
        req.rawBody = buf;
      }
    };
    app.use(bodyParser.json({verify: stripeRaw}));
  } else {
    app.use(bodyParser.json());
  }

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(expressSession({
    secret: process.env.SESSION_SECRET || 'development1212#',
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    resave: false,
    saveUninitialized: false,
  }));
  // authentication
  require('./_passport/passport')(passport);
  app.use(passport.initialize());
  app.use(passport.session());
  require('./_routes/routes.js')(app, passport);

  server = app.listen(app.get('port'), () => {
    const port = server.address().port;
    debugBoot('Server running at http://localhost:' + port);
    callback();
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM shutting down');
    server.close( () => {
      process.exit(0);
    });
  });
};

// =========================================== main ===========================================
const launch = (callback) => {
  startProcessTime = moment();
  async.series([
    (next) => {
      debugBoot('-->launchDatabase<--');
      require('./database/database')(mongoose, next);
    },
    (next) => {
      debugBoot('-->launchLogger<--');
      addMongoDBTransport((err) => {
        return next(err);
      });
    },
    (next) => {
      debugBoot('-->Seed<--');
      startSeeding(next);
    },
    (next) => {
      debugBoot('-->Setting up server<--');
      setupServer(next);
    },
    (next) => {
      debugBoot('-->Setting timezone<--');
      setTimeZone(next);
    },
    (next) => {
      debugBoot('-->Socket Messenger<--');
      const io = require('socket.io')(server);
      initSocketListener(io);
      startSeeding(next);
    },
    (next) => {
      debugBoot('-->License<--');
      const options = {};
      getLicenseInformation(options, (err) => {
        if (err) {
          console.error(err);
        }
        return next();
      });
    },
    (next) => {
      debugBoot('-->I2C<--');
      bootI2C(next);
    },
    (next) => {
      debugBoot('-->Sensors & Relays<--');
      const bootOptions = {};
      bootSensorsAndRelays(bootOptions, next);
    },
  ],
  (err) => {
    if (err) {
      return callback(err);
    }
    sendMessage('system', {payload: 'booted'});
    bootLicenseCronjob();
    return callback();
  }
  );
};

launch((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    debugBoot('-->Boot Completed<--');
    debugBoot(`Booting took ${moment().diff(startProcessTime, 'seconds')} seconds`);
    debugBoot(`\n================================= BOOTED ${getLocalTime('DD.MM HH:mm:ss')} ========================\n`);
  }
});
