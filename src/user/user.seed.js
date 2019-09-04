const {UserModel} = require('./user.model');
const adminSeed = require('./admin.seed');

/**
 * Seeds the admin user if none seeded
 * @param {*} callback
 */
const seedAdmin = (callback) => {
  UserModel.findOne({permissionLevel: 'autoLogin'}).limit(1).exec((err, userFound) => {
    if (err) {
      return callback(err);
    } else if (userFound) {
      return callback(null);
    } else {
      UserModel.create(adminSeed, callback);
    }
  });
};

module.exports = {seedAdmin};
