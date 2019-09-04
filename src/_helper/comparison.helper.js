'use strict';
const _ = require('lodash');

const compareObjects = (a, b) =>
  _.reduce(a, ((result, value, key) => {
    if (_.isEqual(value, b[key])) {
      return result;
    } else {
      return result.concat(key);
    }
  }), []);

const determineType = function(checkMe) {
  const what = Object.prototype.toString;
  const result = what.call(checkMe);
  switch (result) {
    case '[object String]':
      return 'string';
    case '[object Number]':
      return 'number';
    case '[object Error]':
      return 'error';
    case '[object Object]':
      if (checkMe.toISOString != null) { return 'date'; }
      if ( checkMe.toString && /[a-z0-9]{24}/.test( checkMe.toString() ) ) { return 'objectId'; }
      return 'object';
    case '[object Array]':
      return 'array';
    case '[object Date]':
      return 'date';
    case '[object Boolean]':
      return 'boolean';
    case '[object Function]':
      return 'function';
    default:
      // console.log result
      return null;
  }
};

module.exports = {compareObjects, determineType};
