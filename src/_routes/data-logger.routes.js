'use strict';
const mongoose = require('mongoose');
const BAD_REQUEST = 400;

const ObjectId = mongoose.Types.ObjectId;

const routesService = require('./routes.service.js');
const {readEvents, clearEvents} = require('../data-logger/data-logger.service.js');

const routes = (app) => {
  // relay routes ===============================================================
  app.post('/core/readEvents', routesService.clean, (req, res) => {
    console.time('readEvents');
    const filterReadEvents = {};
    if (req.body.filterReadEvents && req.body.filterReadEvents.relays) {
      filterReadEvents.relay = {$in: req.body.filterReadEvents.relays.map( (id) => new ObjectId(id))};
    }
    const optionsReadEvents = req.body.optionsReadEvents || {populate: {relay: {}}};
    optionsReadEvents.limit = 10;

    readEvents(filterReadEvents, optionsReadEvents, (err, events) => {
      console.timeEnd('readEvents');
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json(events);
    });
  });

  app.post('/core/clearEvents', routesService.clean, (req, res) => {
    const filterClearEvents = req.body.filterReadEvents || {};
    const optionsClearEvents = req.body.optionsReadEvents || {};
    clearEvents(filterClearEvents, optionsClearEvents, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      return res.json({success: true});
    });
  });
};
module.exports = routes;
