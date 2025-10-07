import { config } from '../config';
import { Redis } from 'ioredis';
import { ErrorHandler } from '../middleware/errorHandler';
import { PerformanceObserver, performance } from 'perf_hooks';
import { promisify } from 'util';
import { createGzip } from 'zlib';

export class MonitoringService {
  private static instance: MonitoringService;
  private redis: Redis;
  private performanceObserver: PerformanceObserver;
  private readonly METRIC_TTL = 86400; // 24 hours

  private constructor() {
    this.redis = new Redis({
      host: config.database.host,
      port: config.database.port,
      password: config.database.password,
    });

    // Initialize performance monitoring
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.logPerformanceMetric(entry);
      });
    });
    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Start monitoring a request
  public startMonitoring(req: any): void {
    performance.mark(`request_start_${req.id}`);
  }

  // End monitoring a request
  public endMonitoring(req: any): void {
    performance.measure(`request_duration_${req.id}`, `request_start_${req.id}`);
  }

  // Log performance metrics
  private async logPerformanceMetric(entry: PerformanceEntry): Promise<void> {
    try {
      const metric = {
        type: entry.entryType,
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        timestamp: new Date().toISOString()
      };

      await this.redis.rpush('performance_metrics', JSON.stringify(metric));
      await this.redis.expire('performance_metrics', this.METRIC_TTL);
    } catch (error) {
      console.error('Error logging performance metric:', error);
    }
  }

  // Get recent performance metrics
  public async getRecentMetrics(limit = 100): Promise<any[]> {
    try {
      const metrics = await this.redis.lrange('performance_metrics', 0, limit - 1);
      return metrics.map(metric => JSON.parse(metric));
    } catch (error) {
      console.error('Error retrieving metrics:', error);
      return [];
    }
  }

  // Clear metrics
  public async clearMetrics(): Promise<void> {
    try {
      await this.redis.del('performance_metrics');
    } catch (error) {
      console.error('Error clearing metrics:', error);
    }
  }

  // Log request/response data
  public async logRequest(req: any, res: any): Promise<void> {
    try {
      const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: performance.now() - req.startTime,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        headers: req.headers,
        query: req.query,
        body: req.body
      };

      // Compress the log data
      const compressed = await promisify(createGzip())(JSON.stringify(log));
      
      await this.redis.rpush('request_logs', compressed);
      await this.redis.expire('request_logs', this.METRIC_TTL);
    } catch (error) {
      console.error('Error logging request:', error);
    }
  }

  // Get recent request logs
  public async getRequestLogs(limit = 100): Promise<any[]> {
    try {
      const logs = await this.redis.lrange('request_logs', 0, limit - 1);
      return logs.map(log => JSON.parse(Buffer.from(log).toString()));
    } catch (error) {
      console.error('Error retrieving request logs:', error);
      return [];
    }
  }

  // Clear request logs
  public async clearRequestLogs(): Promise<void> {
    try {
      await this.redis.del('request_logs');
    } catch (error) {
      console.error('Error clearing request logs:', error);
    }
  }

  // Monitor API usage
  public async logAPIUsage(req: any): Promise<void> {
    try {
      const usage = {
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method,
        user: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        responseTime: performance.now() - req.startTime
      };

      await this.redis.rpush('api_usage', JSON.stringify(usage));
      await this.redis.expire('api_usage', this.METRIC_TTL);
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  }

  // Get API usage statistics
  public async getAPIUsageStats(): Promise<any> {
    try {
      const usage = await this.redis.lrange('api_usage', 0, -1);
      const parsedUsage = usage.map(u => JSON.parse(u));

      return {
        totalRequests: parsedUsage.length,
        endpoints: this.getEndpointStats(parsedUsage),
        users: this.getUserStats(parsedUsage),
        responseTimes: this.getResponseTimeStats(parsedUsage)
      };
    } catch (error) {
      console.error('Error getting API usage stats:', error);
      return {};
    }
  }

  private getEndpointStats(usage: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    usage.forEach(u => {
      stats[u.endpoint] = (stats[u.endpoint] || 0) + 1;
    });
    return stats;
  }

  private getUserStats(usage: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    usage.forEach(u => {
      if (u.user) {
        stats[u.user] = (stats[u.user] || 0) + 1;
      }
    });
    return stats;
  }

  private getResponseTimeStats(usage: any[]): {
    average: number;
    min: number;
    max: number;
    p95: number;
  } {
    const times = usage.map(u => u.responseTime).sort((a, b) => a - b);
    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: times[0],
      max: times[times.length - 1],
      p95: times[Math.floor(times.length * 0.95)]
    };
  }
}

export const monitoring = MonitoringService.getInstance();
