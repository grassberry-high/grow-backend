'use strict';
const BAD_REQUEST = 400;
const routesService = require('./routes.service.js');
const {addRelays} = require('../patch/patch.service.js');

const routes = (app) => {
  app.get('/core/addRelays', routesService.clean, (req, res) =>
    addRelays((err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    })
  );
};
module.exports = routes;
