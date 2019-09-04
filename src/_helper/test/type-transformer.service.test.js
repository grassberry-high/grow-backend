'use strict';
const root = '../../';
const path = require('path');
require('dotenv').config({path: path.join(__dirname, root, '../mocha/.test.env')});
require('debug').enable(process.env.DEBUG);
const chai = require('chai');
const expect = chai.expect;

const typeTransformerService = require(root + '/_helper/type-transformer.service.js');

describe('>>>>>>>>>>>>>>>>>>>>>>>>>  TYPE TRANSFORMER FUNCTIONS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', () =>

  it('should be able to transform a hex buffer to array', function() {
    const buffer = Buffer.from('ff9c0000023300002f', 'hex');
    const expectedArray = [255, 156, 0, 0, 2, 51, 0, 0, 47];
    const result = typeTransformerService.toArray(buffer);
    expect(result).deep.equal(expectedArray);
  })
);
