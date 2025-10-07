// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  REACT_APP_API_URL: 'http://localhost:3000/api',
  REACT_APP_KOBOTOOLBOX_TOKEN: 'mock-token',
  REACT_APP_KOBOTOOLBOX_USERNAME: 'mock-user'
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mock-data' }),
    ok: true,
    status: 200
  })
);

// Mock crypto functions
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('mock-random-bytes')),
  createHmac: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  digest: jest.fn(() => Buffer.from('mock-hmac'))
}));

// Mock minimal DOM environment
global.document = {
  createElement: jest.fn(),
  querySelector: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  navigator: {
    userAgent: 'Node.js'
  }
};

// Mock AWS DynamoDB
global.dynamoDBMock = mockClient(DynamoDBClient);

// Mock date functions
jest.mock('date-fns', () => ({
  format: jest.fn(),
  parse: jest.fn(),
  startOfDay: jest.fn(),
  endOfDay: jest.fn()
}));

// Mock crypto functions
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('mock-random-bytes')),
  createHmac: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  digest: jest.fn(() => Buffer.from('mock-hmac'))
}));

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  REACT_APP_API_URL: 'http://localhost:3000/api',
  REACT_APP_KOBOTOOLBOX_TOKEN: 'mock-token',
  REACT_APP_KOBOTOOLBOX_USERNAME: 'mock-user'
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mock-data' }),
    ok: true,
    status: 200
  })
);

// Mock minimal WebSocket
global.WebSocket = class {
  constructor() {}
  send() {}
  close() {}
};

// Mock minimal localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock minimal indexedDB
global.indexedDB = {
  open: jest.fn()
};

// Mock minimal observers
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.ResizeObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock minimal matchMedia
global.matchMedia = jest.fn(() => ({
  matches: false,
  addListener: jest.fn(),
  removeListener: jest.fn()
}));

// Mock crypto and performance
global.crypto = {
  randomUUID: jest.fn(() => 'mock-uuid')
};

global.performance = {
  now: jest.fn(() => 1000)
};

// Mock console methods for better test output
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore original console methods after each test
afterEach(() => {
  global.console.log.mockClear();
  global.console.warn.mockClear();
  global.console.error.mockClear();
});

// Mock fetch with custom response
beforeEach(() => {
  global.fetch.mockClear();
  global.fetch.mockImplementation((url) => {
    if (url.includes('error')) {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Mock error' })
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'mock-data' })
    });
  });
});

// Mock localStorage methods
beforeEach(() => {
  global.localStorage.getItem.mockClear();
  global.localStorage.setItem.mockClear();
  global.localStorage.removeItem.mockClear();
  global.localStorage.clear.mockClear();
});

// Mock indexedDB methods
beforeEach(() => {
  global.indexedDB.open.mockClear();
});

// Mock WebSocket methods
beforeEach(() => {
  global.WebSocket = MockWebSocket;
});
