'use strict';
const CMD_SWITCH_ON = 0x01;
const CMD_SWITCH_OFF = 0x00;

const debug = require('debug');

const debugRelay = debug('relay');

const {sendMessage} = require('../_socket-io/socket-io-messenger.js');

const DataLogger = require('../data-logger/data-logger.class.js');
const dataLogger = new DataLogger();

/**
 * Relay class: a single relay of the relay controller
 */
class Relay {
  /**
   * Relay constructor
   * @param {object} options -id, label, name, address, relayController (_id)
   */
  constructor(options) {
    // console.info "options", options
    this._id = options._id || (() => {
      throw new Error('Id is required');
    })();
    this.label = options.label || (() => {
      throw new Error('Label is required');
    })();
    if (options.name) {
      this.name = options.name;
    }
    this.address = options.address || (() => {
      throw new Error('Address is required');
    })();
    this.relayController = options.relayController || (() => {
      throw new Error('Relay controller is required');
    })();
    this.state = 0;
    this.blockedBy = null;
    // relays which have rules that block for a period after triggering are blocked default on boot to prevent e.g. water damage
    // RuleModel.findOne({relay: @._id, durationMBlocked: {$ne: null}}).select({durationMBlocked:1}).lean().exec (err, rule)->
    //   if rule?
    //     that.blockedTill = moment().add(rule.durationMBlocked, 'minutes')
    //   else
    //     that.blockedTill = null
    // logger.info "Registered Relay  #{inspect options}"
  }

  // --------------------------- Database Operations -----------------------------
  /**
   * Log a relay event with dataLogger
   * @param {string} state
   * @param {string} info
   * @param {*} callback
   */
  createEvent(state, info, callback) {
    dataLogger.createEvent(this, state, info, callback);
  }

  /**
   * Switch on a relay
   * @param {string} info
   * @param {object} detectorId
   * @param {*} callback
   * @return {*}
   */
  switchOn(info, detectorId, callback) {
    if (this.state === 1) {
      return callback(null);
    }

    this.relayController.switchRelay(CMD_SWITCH_ON, this.address, (err) => {
      if (err) {
        return callback(err);
      }
      debugRelay(`Switched relay ${this.name} (${this._id}) address ${this.address} ON was ${this.state}`);
      this.blockedBy = detectorId;
      this.state = 1;
      this.broadcastRelay();
      this.createEvent('on', info, callback);
    });
  }

  /**
   * Switch off a relay
   * @param {string} info
   * @param {object} detectorId
   * @param {*} callback
   * @return {*}
   */
  switchOff(info, detectorId, callback) {
    if (this.state === 0) {
      return callback(null);
    }
    this.relayController.switchRelay(CMD_SWITCH_OFF, this.address, (err) => {
      if (err) {
        return callback(err);
      }
      debugRelay(`Switched relay ${this.name} (${this._id}) address ${this.address} OFF was ${this.state}`);
      this.blockedBy = null;
      this.state = 0;
      this.broadcastRelay();
      this.createEvent('off', info, callback);
    });
  }

  /**
   * Broadcast relay data
   */
  broadcastRelay() {
    sendMessage('relayData', {'payload': this});
  }
}

// TODO check if relays need to be corrected after a power cut

module.exports = Relay;
