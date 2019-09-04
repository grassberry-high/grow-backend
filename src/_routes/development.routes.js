'use strict';
const debug = require('debug');
const routesService = require('./routes.service.js');
const httpStatus = require('http-status-codes');

const routes = (app) => {
  // dev routes ===============================================================
  app.get('/core/test', routesService.clean, (req, res) => res.json({test: true}));

  app.post('/core/setDebugVar', routesService.clean, (req, res) => {
    if (!req.body || !req.body.debug) {
      return res.status(httpStatus.BAD_REQUEST).json({err: "Debug not specified"});
    }
    debug.enable(req.body.debug);
    console.log("Set debug to", req.body.debug);
    return res.json({success: true});
  });

};
module.exports = routes;
