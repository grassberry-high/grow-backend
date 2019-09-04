'use strict';
const debugChamber = require('debug')('chamber');
const {inspect} = require('util');

const {ChamberModel} = require('../chamber/chamber.model');

const {logger} = require('../_logger/logger.js');

/**
 * A chamber has the basic information about a grow and a set of rules. Those rules process sensor inputs and operate outputs.
 */
class Chamber {
  /**
   * Chamber constructor
   * @param {object} options - Chamber properties
   */
  constructor(options) {
    // TODO: check with new fe if still up-to-date
    // console.info "options", options
    this._id = options._id || (() => {
      throw new Error('Id is required');
    })();
    this.name = options.name || (() => {
      throw new Error('Name is required');
    })();
    this.strains = options.strains || (() => {
      throw new Error('At least one strain is required');
    })();
    this.light = options.light || {};
    this.sensors = options.sensors || [];
    if (options.day != null) {
      this.day = options.day;
    }
    if (options.cycle != null) {
      this.cycle = options.cycle;
    }


    logger.info(`Registered Chamber  ${inspect(options)}`);
  }

  // --------------------------- Database Operations -----------------------------
  /**
   * Save a new chamber to the DB
   * @param {*} callback: fn(err)
   */
  save(callback) {
    debugChamber(this);
    const chamber = new ChamberModel(this);
    chamber.save((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }
      callback(null);
    });
  }

  /**
   * Update an existing chamber
   * @param {*} callback: fn(err, updatedChamber)
   */
  update(callback) {
    ChamberModel.findOneAndUpdate(this._id, this).exec((err, updatedChamber) => {
      if (err) {
        return callback(new Error(err));
      }
      callback(null, updatedChamber);
    });
  }
}
module.exports = Chamber;
