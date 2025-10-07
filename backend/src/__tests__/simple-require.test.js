// Simple test with CommonJS require
const assert = require('assert');

console.log('Simple test file is being executed');

describe('Simple Test Suite', function() {
  console.log('Setting up test suite');

  before(function() {
    console.log('Running before');
  });

  beforeEach(function() {
    console.log('Running beforeEach');
  });

  it('should pass a simple assertion', function() {
    console.log('Running test');
    assert.strictEqual(1 + 1, 2);
  });

  afterEach(function() {
    console.log('Running afterEach');
  });

  after(function() {
    console.log('Running after');
  });
});
