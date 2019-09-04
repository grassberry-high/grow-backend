'use strict';
const UNAUTHORIZED = 401;

const sanitize = require('mongo-sanitize');

const clean = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  return next();
};

const loggedIn = (req, res, next) => {
  if (req.user) {
    return next();
  } else {
    return res.status(UNAUTHORIZED).send('Unauthorized!');
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.permissionLevel === 'superAdmin')) {
    return next();
  } else {
    return res.status(UNAUTHORIZED).send('Unauthorized!');
  }
};

const onShowModeBlocked = (req, res, next) => {
  if ((process.env.ON_SHOW_MODE_BLOCKED === 'true') && (!req.user || (req.user.permissionLevel !== 'superAdmin'))) {
    return res.status(UNAUTHORIZED).send({warning: 'Access is currently blocked! The device is on show mode.'});
  } else {
    return next();
  }
};

const getRegex = (term) => {
  try {
    return new RegExp(term, 'i');
  } catch (err) {
    return new RegExp('.*', 'i');
  }
};

module.exports = {clean, loggedIn, isAdmin, onShowModeBlocked, getRegex};
