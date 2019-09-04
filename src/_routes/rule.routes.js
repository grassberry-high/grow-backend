'use strict';
const BAD_REQUEST = 400;

const async = require('async');

const routesService = require('./routes.service.js');
const {spliceRule} = require('../chamber/chamber.service.js');
const {removeRule} = require('../rule/rule.service.js');

const routes = (app) => {
  // sensor routes ===============================================================
  app.delete('/core/removeRule/:chamberId/:ruleId', routesService.clean, (req, res) => {
    if (!req.params.chamberId) {
      return res.status(BAD_REQUEST).json({err: 'No chamberId'});
    }
    if (!req.params.ruleId) {
      return res.status(BAD_REQUEST).json({err: 'No ruleId'});
    }
    async.series([
      (next) => spliceRule(req.params.chamberId, req.params.ruleId, next),
      (next) => removeRule(req.params.ruleId, next),
    ], (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });
};
module.exports = routes;
