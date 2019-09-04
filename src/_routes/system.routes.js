'use strict';
const BAD_REQUEST = 400;

const async = require('async');

const routesService = require('./routes.service.js');
const {getSystem} = require('../system/system.read.js');
const {getLicenseInformation, updateSystem} = require('../system/system.update.js');
const {sendLogs} = require('../system/system.support.js');
const {configureDateTime, reset} = require('../shell/shell.service.js');

const routes = (app) => {
  // chamber routes ===============================================================
  app.get('/core/getSystem', routesService.clean, (req, res) => {
    const options = req.params.options || {};
    getSystem(options, (err, system) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json(system);
    });
  });

  app.get('/core/getLicenseInformation', routesService.clean, (req, res) => {
    const options = req.params.options || {};
    getLicenseInformation(options, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });

  app.post('/core/updateSystem', routesService.clean, (req, res) => {
    if (!req.body.system) {
      return res.status(BAD_REQUEST).json({err: 'No system'});
    }
    const appUser = req.user || null;
    const data = req.body.system;
    const options = {};
    updateSystem(appUser, data, options, (err, system) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json(system);
    });
  });

  app.post('/core/configureDateTime', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    if (!req.body.dateTimeConfig) {
      return res.status(BAD_REQUEST).json({err: 'No date/time config'});
    }
    const appUser = req.user || null;
    const {dateTimeConfig} = req.body;
    async.series([
      (next) => {
        const options = {};
        updateSystem(appUser, dateTimeConfig, options, next);
      },
      (next) => configureDateTime(dateTimeConfig, next),
    ], (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });

  app.get('/core/sendLogs', routesService.clean, (req, res) => {
    const options = req.params.options || {};
    sendLogs(options, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({status: 'System report has been sent.'});
    });
  });

  app.get('/core/reset', routesService.clean, routesService.onShowModeBlocked, (req, res) =>
    async.waterfall([
      (next) => reset(next),
      (next) => reset(next),
    ], (err, success) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success});
    }) // will never be called when raspi reboots
  );
};
module.exports = routes;
