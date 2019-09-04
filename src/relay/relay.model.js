'use strict';
const mongoose = require('mongoose');

const RelaySchema = new mongoose.Schema({
  address: Number,
  label: String,
  name: String,
});

let RelayModel;
try {
  RelayModel = mongoose.model('Relay');
} catch (err) {
  RelayModel = mongoose.model('Relay', RelaySchema);
}
module.exports = {RelayModel, RelaySchema};
