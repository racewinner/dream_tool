import { ElectricitySource, TransportAccess } from '../src/models/survey';
import { DataImportService } from '../src/services/dataImportService';

// Create test class to expose protected methods for testing
class TestDataImportService extends DataImportService {
  // Expose protected methods for testing
  public testMapElectricitySource(source: string): ElectricitySource {
    return (this as any).mapElectricitySource(source);
  }

  public testMapTransportAccess(access: string): TransportAccess {
    return (this as any).mapTransportAccess(access);
  }

  public testIsValidElectricitySource(value: any): boolean {
    return (this as any).isValidElectricitySource(value);
  }

  public testIsValidTransportAccess(value: any): boolean {
    return (this as any).isValidTransportAccess(value);
  }
}

// Initialize test instance
const testService = new TestDataImportService();

// Test electricity source mapping
console.log('\n=== Testing ElectricitySource mapping ===');
const electricitySources = [
  'solar',
  'Solar panel',
  'diesel generator',
  'grid connection',
  'National Grid',
  'mini_grid',
  'mini-grid',
  'hybrid system',
  'other',
  'none',
  'no electricity',
  'unknown',
  '',
  undefined,
];

electricitySources.forEach(source => {
  const mapped = testService.testMapElectricitySource(source as string);
  console.log(`"${source}" => ${mapped}`);
});

// Test transport access mapping
console.log('\n=== Testing TransportAccess mapping ===');
const transportAccesses = [
  'paved road',
  'paved_road',
  'unpaved road',
  'unpaved_road',
  'seasonal access',
  'seasonal_access',
  'difficult access',
  'difficult_access',
  'poor access',
  'no access',
  'good road',
  'dirt road',
  'unknown',
  'strange value',
  '',
  undefined,
];

transportAccesses.forEach(access => {
  const mapped = testService.testMapTransportAccess(access as string);
  console.log(`"${access}" => ${mapped}`);
});

// Test validation methods
console.log('\n=== Testing validation methods ===');
const testValues = [
  ElectricitySource.SOLAR,
  ElectricitySource.DIESEL_GENERATOR,
  TransportAccess.PAVED_ROAD,
  TransportAccess.DIFFICULT_ACCESS,
  'invalid string',
  123,
  null,
  undefined,
];

testValues.forEach(value => {
  const isValidElectricity = testService.testIsValidElectricitySource(value);
  const isValidTransport = testService.testIsValidTransportAccess(value);
  console.log(`Value: ${value}`);
  console.log(`- isValidElectricitySource: ${isValidElectricity}`);
  console.log(`- isValidTransportAccess: ${isValidTransport}`);
});

console.log('\n=== Test completed successfully ===');
