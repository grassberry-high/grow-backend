'use strict';
const {inspect} = require('util');
const BAD_REQUEST = 400;

const debug = require('debug');

const debugRoutes = debug('routes:subscription');

const async = require('async');

const routesService = require('./routes.service.js');
const {emit} = require('../_api/rest.helper.js');
const apiEndpointsModule = require('../_api/api-endpoints.js');

const apiEndpoints = apiEndpointsModule();
const {getSerial} = require('../shell/shell.service.js');

const routes = (app) => {
  // sensor routes ===============================================================
  app.post('/core/sendSubscription', routesService.clean, (req, res) => {
    const subscription = req.body;
    debugRoutes(inspect(req.body));
    debugRoutes(inspect(subscription));
    if (!subscription.stripeToken) {
      return res.status(BAD_REQUEST).json({err: 'Something went wrong'});
    }
    async.waterfall([
      (next) => getSerial(next),
      (serial, next) => {
        subscription.serial = serial;
        const method = 'POST';
        const url = apiEndpoints['subscription'];
        emit(method, url, subscription, next);
      },
    ], (err) => {
      if (err) {
        debugRoutes(inspect(err));
        return res.redirect(`/#!/subscription?err=${JSON.stringify(err)}`);
      }
      return res.redirect('/#!/subscription?success=true');
    });
  });
};
module.exports = routes;
