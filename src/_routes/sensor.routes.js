'use strict';
const BAD_REQUEST = 400;

const async = require('async');

const routesService = require('./routes.service.js');
const {
  broadcastSensors,
  getSensorsRaw,
  getSensors,
  updateSensorTimeUnit,
  bootSensors,
} = require('../sensor/sensor.service.js');
const {upsertSensor, updateDetectorName} = require('../sensor/sensor.create-update.js');
const {removeSensor} = require('../sensor/sensor.delete.js');

const routes = (app) => {
  // sensor routes ===============================================================
  app.get('/core/broadcastSensors', routesService.clean, (req, res) =>
    broadcastSensors((err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    })
  );

  app.post('/core/getSensorsRaw', routesService.clean, (req, res) => {
    const filter = req.body.filter || {};
    const options = req.body.options || {};
    getSensorsRaw(filter, options, (err, sensors) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json(sensors);
    });
  });

  app.post('/core/getSensors', routesService.clean, (req, res) => {
    const options = req.body.options || {};
    getSensors(options, (err, sensors) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json(sensors);
    });
  });

  app.post('/core/upsertSensor', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    if (!req.body.sensor) {
      return res.status(BAD_REQUEST).json({err: 'No sensor data'});
    }
    upsertSensor(req.body.sensor, {}, (err, success) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success});
    });
  });

  app.post('/core/updateSensorTimeUnit', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    const options = req.body.options || {};
    const sensorId = req.body.sensorId || null;
    const newTimeUnit = req.body.newTimeUnit || null;
    updateSensorTimeUnit(sensorId, newTimeUnit, options, (err, sensor) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json(sensor);
    });
  });

  app.post('/core/updateDetectorName', routesService.clean, routesService.onShowModeBlocked, (req, res) => {
    if (!req.body.newDetectorName) {
      return res.status(BAD_REQUEST).json({err: 'No new detector name'});
    }
    const options = req.body.options || {};
    const {detectorId} = req.body;
    const {newDetectorName} = req.body;
    updateDetectorName(detectorId, newDetectorName, options, (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });

  app.delete('/core/removeSensor/:id', routesService.clean, (req, res) => {
    if (!req.params.id) {
      return res.status(BAD_REQUEST).json({err: 'No sensor id'});
    }
    const {id} = req.params;
    async.series([
      (next) => removeSensor(id, {}, next),
      (next) => bootSensors({}, next),
    ], (err) => {
      if (err) {
        return res.status(BAD_REQUEST).json({userErr: err});
      }
      res.json({success: true});
    });
  });
};
module.exports = routes;
