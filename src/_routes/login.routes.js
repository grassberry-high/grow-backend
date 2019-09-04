'use strict';
const _ = require('lodash');
const {logger} = require('../_logger/logger.js');
const routes = (app, passport) => {
// ==================================================== SIGNUP & LOGIN ====================================================
  app.post(
    '/signup',
    passport.authenticate(
      'local-signup',
      {
        successRedirect: '/',
        failureFlash: true,
      })
  );

  app.post(
    '/login',
    passport.authenticate(
      'local-login',
      {
        failureMessage: 'Invalid username or password',
      }),
    (req, res) => res.json({success: true}));


  app.get('/core/logout', (req, res) => {
    req.logout();
    return res.redirect('/');
  });


  app.get('/core/getAppUser', (req, res) => {
    let responseUser = {};
    // console.log "req.user", req.user
    if (req.user) {
      responseUser = _.pick(req.user, ['_id', 'lastName', 'firstName', 'permissionLevel']);
    }
    res.json(responseUser);
  });

  // ====================================================  Instagram ====================================================

  app.get('/core/auth/instagram', passport.authenticate('instagram', {scope: ['basic', 'public_content']}));

  app.get('/core/auth/instagram/callback', (req, res, next) =>
    passport.authenticate('instagram', (err, user, info) => {
      // console.log "err #{err} user #{user} info #{JSON.stringify(info)}"
      if ((info != null ? info.message : undefined) != null) {
        res.status(403);
        return res.redirect(`/#/oauth-error/${info.message}`);
      } else if (user != null) {
        req.login(user, () => // err, user
          // console.log "err #{err} user #{user}"
          res.redirect('/')
        );
      } else {
        if (err) {
          logger.error(err);
        }
        res.status(403);
        res.redirect('/#/oauth-error/Es ist ein Fehler beim Login aufgetreten');
      }
    })(req, res, next)
  );
};
module.exports = routes;
