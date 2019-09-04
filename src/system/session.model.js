'use strict';
const mongoose = require('mongoose');
const SessionSchema = new mongoose.Schema({
  _id: String, // TODO: check really string
  session: String,
  expires: Date,
});

let SessionModel;
try {
  SessionModel = mongoose.model('Session');
} catch (err) {
  SessionModel = mongoose.model('Session', SessionSchema);
}
module.exports = {SessionModel, SessionSchema};
