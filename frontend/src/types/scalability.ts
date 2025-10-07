export interface LoadBalancingConfig {
  enabled: boolean;
  strategy: 'ROUND_ROBIN' | 'LEAST_CONNECTIONS' | 'IP_HASH' | 'URL_HASH';
  healthCheck: {
    interval: number;
    timeout: number;
    retries: number;
    path: string;
  };
  servers: ServerConfig[];
}

export interface ServerConfig {
  id: string;
  host: string;
  port: number;
  weight: number;
  maxConnections: number;
  status: 'UP' | 'DOWN' | 'MAINTENANCE';
  metrics: ServerMetrics;
}

export interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  responseTime: number;
  errorRate: number;
  connections: number;
}

export interface CachingConfig {
  enabled: boolean;
  provider: 'REDIS' | 'MEMCACHED' | 'MEMORY';
  ttl: number;
  maxMemory: number;
  compression: boolean;
  cacheKeys: string[];
}

export interface DatabaseConfig {
  type: 'SQL' | 'NOSQL' | 'GRAPH';
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  pool: {
    min: number;
    max: number;
    idleTimeout: number;
    reapInterval: number;
  };
  replication: {
    enabled: boolean;
    strategy: 'MASTER_SLAVE' | 'MASTER_MASTER' | 'CLUSTER';
    nodes: string[];
  };
}

export interface QueueConfig {
  provider: 'RABBITMQ' | 'KAFKA' | 'SQS';
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  queues: Queue[];
}

export interface Queue {
  name: string;
  type: 'DIRECT' | 'TOPIC' | 'FANOUT';
  durable: boolean;
  autoDelete: boolean;
  maxMessages: number;
  retentionTime: number;
}

export interface RateLimitingConfig {
  enabled: boolean;
  window: number;
  limit: number;
  per: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY';
  methods: string[];
  paths: string[];
  storage: 'MEMORY' | 'REDIS' | 'DATABASE';
}

export interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  metrics: Metric[];
  thresholds: Threshold[];
  cooldown: number;
}

export interface Metric {
  name: string;
  type: 'CPU' | 'MEMORY' | 'NETWORK' | 'REQUESTS';
  weight: number;
}

export interface Threshold {
  metric: string;
  value: number;
  operator: '<' | '>' | '<=' | '>=';
  action: 'SCALE_UP' | 'SCALE_DOWN';
}
