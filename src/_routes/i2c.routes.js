'use strict';
const BAD_REQUEST = 400;

const debug = require('debug');

const debugRoutesI2c = debug('routes:i2c');

const routesService = require('./routes.service.js');
const {getActiveDevices, updateI2CAddress} = require('../i2c/i2c.js');

const routes = (app) => {
  // chamber routes ===============================================================
  app.get('/core/getActiveDevices', routesService.clean, (req, res) =>
    getActiveDevices((err, activeDevices) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json(activeDevices);
    })
  );

  app.post('/core/updateI2CAddress', routesService.clean, (req, res) => {
    const requiredFields = {
      sensorType: 'Sensor type is required.',
      oldAddress: 'Old address is required.',
      newAddress: 'New address is required.',
    };
    const err = [];
    for (const key in requiredFields) {
      if ((req.body[key] == null)) {
        err.push(requiredFields[key]);
      }
    }
    if (err.length > 0) {
      return res.json({err: err.join(' ')});
    }

    debugRoutesI2c(req.body);
    updateI2CAddress(req.body.sensorType, req.body.oldAddress, req.body.newAddress, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });
};
module.exports = routes;
