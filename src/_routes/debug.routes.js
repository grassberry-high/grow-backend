'use strict';
const BAD_REQUEST = 400;
const {getDbSize} = require('../_helper/debug.helper.js');

const routes = (app) => {
  app.get('/core/getDbSize/:collection', (req, res) =>
    getDbSize(req.params.collection, (err, dbSize) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json({dbSize});
    })
  );
};
module.exports = routes;
