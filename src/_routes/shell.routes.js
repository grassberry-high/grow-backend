'use strict';
const BAD_REQUEST = 400;

const routesService = require('./routes.service.js');
const {getWifiOptions, configureWifi, getSerial, reboot} = require('../shell/shell.service.js');

const routes = (app) => {
// ==================================================== USERS ====================================================
  app.get('/core/getWifiOptions', routesService.clean, (req, res) =>
    getWifiOptions((err, wifiOptions) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json(wifiOptions);
    })
  );

  app.post('/core/configureWifi', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    if (!req.body.wifi) {
      return res.status(BAD_REQUEST).json({err: 'No wifi'});
    }
    configureWifi(req.body.wifi, (err, success) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success});
    });
  });

  app.get('/core/getSerial', routesService.clean, (req, res) =>
    getSerial((err, serial) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({serial});
    })
  );

  app.get('/core/reboot', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    const appUser = req.user || null;
    const options = {};
    reboot(appUser, options, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({});
    }); // never gets called
  });
};
module.exports = routes;
