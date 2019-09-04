'use strict';


const DataLogger = require('./data-logger.class.js');


const readEvents = DataLogger.readEvents;
const clearEvents = DataLogger.clearEvents;

module.exports = {readEvents, clearEvents};
