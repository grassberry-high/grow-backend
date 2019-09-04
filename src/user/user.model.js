'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  active: Boolean,
  email: String,
  hashedPassword: String,
  lastName: String,
  permissionLevel: String,
  token: String,
});

UserSchema.methods.generateHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

UserSchema.methods.validHashPassword = (password) => {
  // eslint-disable-next-line no-invalid-this
  if ((this.password == null)) {
    return false;
  }
  // eslint-disable-next-line no-invalid-this
  return bcrypt.compareSync(password, this.password);
};


let UserModel;
try {
  UserModel = mongoose.model('User');
} catch (err) {
  UserModel = mongoose.model('User', UserSchema);
}
module.exports = {UserModel, UserSchema};
