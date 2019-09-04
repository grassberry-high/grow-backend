'use strict';
const LocalStrategy = require('passport-local');
const {UserModel} = require('../user/user.model');

/**
 * Adds serializeUser & deserializeUser to passport module
 * @param {object} passport
 */
const passportAddStrategies = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    UserModel.findOne({_id: id}).exec((err, user) => {
      done(err, user);
    });
  });

  // ----------------------------------- LOCAL SIGNUP ---------------------------------------------------------------------------------------------------------------------------------------

  /**
   * Local signup strategy
   */
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'invitationCode',
    passwordField: 'password',
    passReqToCallback: true,
  }, (req, invitationCode, password, done) => {
    process.nextTick(() =>
      UserModel.findOne({invitationCode, 'active': false}).exec((err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          user.password = new UserModel().generateHash(password);
          user.active = true;
          user.save((err) => {
            if (err) {
              throw err;
            }
            return done(null, user);
          });
        } else {
          return done(null, false, {message: 'invitationCode ungültig oder bereits verwendet'});
        }
      }));
  })
  );
  // ----------------------------------- LOCAL LOGIN ---------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Local login strategy
   */
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  }, (req, email, password, done) => {
    if (!email || email === '') {
      return done(null, false, {message: 'Non valid user'});
    }
    UserModel.findOne({'email': email.toLowerCase(), 'active': true}).exec((err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {message: 'Non valid user'});
      }
      if (!user.validPassword(password)) {
        return done(null, false, {message: 'Non valid password'});
      }

      return done(null, user);
    });
  })
  );
};
module.exports = passportAddStrategies;
