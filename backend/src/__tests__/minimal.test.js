// Minimal test to verify Mocha and Chai are working
const { expect } = require('chai');

console.log('Starting minimal test...');

describe('Minimal Test Suite', function() {
  it('should pass a simple assertion', function() {
    console.log('Running simple assertion...');
    expect(1 + 1).to.equal(2);
  });

  it('should handle async code', async function() {
    console.log('Running async test...');
    const result = await Promise.resolve('success');
    expect(result).to.equal('success');
  });
});
