'use strict';
const BAD_REQUEST = 400;

const async = require('async');

const routesService = require('./routes.service.js');
const {emit} = require('../_api/rest.helper.js');
const apiEndpointsModule = require('../_api/api-endpoints.js');

const apiEndpoints = apiEndpointsModule();
const {getSerial} = require('../shell/shell.service.js');

const routes = (app) => {
  // sensor routes ===============================================================
  app.post('/core/sendFeedback', routesService.clean, (req, res) => {
    if (!req.body.feedback) {
      return res.status(BAD_REQUEST).json({err: 'No feedback data'});
    }
    async.waterfall([
      (next) => getSerial(next),
      (serial, next) => {
        const method = 'POST';
        const url = apiEndpoints['feedback'];
        const data = {feedback: req.body.feedback, serial};
        emit(method, url, data, next);
      },
    ], (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });
};
module.exports = routes;
