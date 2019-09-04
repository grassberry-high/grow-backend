'use strict';
const BAD_REQUEST = 400;

const routesService = require('./routes.service.js');
const {getChambers, upsertChamber} = require('../chamber/chamber.service.js');

const routes = (app) => {
  // chamber routes ===============================================================
  app.post('/core/getChambers', routesService.clean, (req, res) => {
    const options = req.body.options || {lean: true, populate: {all: true}};
    getChambers(options, (err, chambers) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json(chambers);
    });
  });

  app.post('/core/upsertChamber', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    if (!req.body.chamber) {
      return res.status(BAD_REQUEST).json({err: 'No chamber data'});
    }
    upsertChamber(req.body.chamber, (err, upsertedChamber) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json(upsertedChamber);
    });
  });
};
module.exports = routes;
