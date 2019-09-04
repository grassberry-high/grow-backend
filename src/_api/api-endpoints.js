'use strict';
const getEndpoints = () => {
  let root;
  if (process.env.NODE_ENV === 'production') {
    root = 'https://grassberry-high.com';
  } else {
    root = 'http://localhost:3000';
  }

  return {
    feedback: root + '/core/api/v1/send-feedback',
    licenses: root + '/core/api/v2/licenses',
    subscription: root + '/core/api/v1/subscription',
    support: root + '/core/api/v1/support',
  };
};
module.exports = getEndpoints;
