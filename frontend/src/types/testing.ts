export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: Test[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime: Date;
  results: TestResult[];
  coverage: TestCoverage;
}

export interface Test {
  id: string;
  name: string;
  description: string;
  type: 'UNIT' | 'INTEGRATION' | 'END_TO_END' | 'PERFORMANCE' | 'SECURITY';
  tags: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  setup: TestSetup;
  teardown: TestTeardown;
  assertions: Assertion[];
}

export interface TestSetup {
  prerequisites: string[];
  data: any;
  environment: string;
  configuration: Record<string, any>;
}

export interface TestTeardown {
  cleanup: string[];
  restore: string[];
  reset: string[];
}

export interface Assertion {
  id: string;
  description: string;
  condition: string;
  expected: any;
  actual: any;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
}

export interface TestResult {
  id: string;
  testId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  startTime: Date;
  endTime: Date;
  duration: number;
  error?: Error;
  logs: TestLog[];
}

export interface TestLog {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  metadata: Record<string, any>;
}

export interface CoverageMetrics {
  total: number;
  covered: number;
  uncovered: number;
  percentage: number;
}

export interface TestCoverage {
  lines: CoverageMetrics;
  functions: CoverageMetrics;
  branches: CoverageMetrics;
  statements: CoverageMetrics;
}

export interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  type: 'LOAD' | 'STRESS' | 'SOAK' | 'SPIKE';
  metrics: PerformanceMetric[];
  thresholds: Threshold[];
  configuration: PerformanceConfig;
}

export interface PerformanceMetric {
  name: string;
  unit: string;
  value: number;
  baseline: number;
  tolerance: number;
}

export interface Threshold {
  metric: string;
  value: number;
  operator: '<' | '>' | '<=' | '>=';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PerformanceConfig {
  duration: number;
  rampUp: number;
  rampDown: number;
  users: number;
  iterations: number;
  thinkTime: number;
  data: TestSetup;
}

export interface SecurityTest {
  id: string;
  name: string;
  description: string;
  type: 'AUTHENTICATION' | 'AUTHORIZATION' | 'ENCRYPTION' | 'INJECTION' | 'XSS' | 'CSRF';
  vectors: AttackVector[];
  detection: Detection[];
  mitigation: Mitigation[];
}

export interface AttackVector {
  id: string;
  name: string;
  description: string;
  payload: string;
  expected: string;
}

export interface Detection {
  id: string;
  name: string;
  description: string;
  rule: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Mitigation {
  id: string;
  name: string;
  description: string;
  implementation: string;
  verification: string;
}
