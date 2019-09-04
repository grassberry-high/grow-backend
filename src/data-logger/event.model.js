'use strict';
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const EventSchema = new mongoose.Schema({
  state: String,
  relay: {
    type: ObjectId,
    ref: 'Relay',
    required: true,
  },
  info: String,
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 3, // expires after 3 days
  },
});

let EventModel;
try {
  EventModel = mongoose.model('Event');
} catch (err) {
  EventModel = mongoose.model('Event', EventSchema);
}
module.exports = {EventModel, EventSchema};
