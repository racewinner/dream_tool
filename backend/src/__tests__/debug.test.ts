// Simple test with console logging for Node's test runner
import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

console.log('Debug test file is being executed');

describe('Debug Test Suite', () => {
  console.log('Setting up test suite');

  before(() => {
    console.log('Running before');
  });

  beforeEach(() => {
    console.log('Running beforeEach');
  });

  it('should log a message', () => {
    console.log('Running test');
    assert.strictEqual(1 + 1, 2);
  });

  afterEach(() => {
    console.log('Running afterEach');
  });

  after(() => {
    console.log('Running after');
  });
});
