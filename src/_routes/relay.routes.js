'use strict';
const BAD_REQUEST = 400;

const routesService = require('./routes.service.js');
const {broadcastRelays, getRelays, renameRelay, upsertRelay, operateRelay} = require('../relay/relay.service.js');
const {getLocalTime} = require('../_helper/conversion.helper.js');

const routes = (app) => {
  // relay routes ===============================================================
  app.get('/core/broadcastRelays', routesService.clean, (req, res) =>
    broadcastRelays((err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json({success: true});
    })
  );

  app.post('/core/getRelays', routesService.clean, (req, res) => {
    const options = req.body.options || {};
    getRelays(options, (err, relays) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json(relays);
    });
  });

  app.post('/core/renameRelay', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    if (!req.body._id) {
      return res.status(BAD_REQUEST).json({err: 'No _id given'});
    }
    if (!req.body.name) {
      return res.status(BAD_REQUEST).json({err: 'No new name given'});
    }
    renameRelay(req.body._id, req.body.name, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });

  app.post('/core/upsertRelay', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    if ((req.body.relay == null)) {
      return res.status(BAD_REQUEST).json({err: 'No relay data'});
    }
    upsertRelay(req.body.relay, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });

  app.put('/core/operateRelay', routesService.clean, (req, res) => {
    if ((req.body.id == null)) {
      return res.status(BAD_REQUEST).json({err: 'Id is required'});
    }
    if ((req.body.operation == null)) {
      return res.status(BAD_REQUEST).json({err: 'Operation is required'});
    }
    const info = `Due user command ${getLocalTime('DD.MM HH:mm:ss')}`;
    operateRelay(req.body.id, req.body.operation, info, null, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json(true);
    });
  });
};
module.exports = routes;
