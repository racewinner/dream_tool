import Redis from 'ioredis';
import { config } from '../config';

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;
  private readonly CACHE_TTL = 86400; // 24 hours in seconds

  private constructor() {
    this.redis = new Redis({
      host: config.database.host,
      port: config.database.port,
      password: config.database.password,
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await this.redis.set(key, data, 'EX', ttl || this.CACHE_TTL);
    } catch (error) {
      console.error('Error setting cache:', error);
      // Don't throw error - cache failure shouldn't affect main functionality
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  generateCacheKey(
    type: 'weather' | 'historical',
    latitude: number,
    longitude: number,
    date?: string
  ): string {
    return `weather:${type}:${latitude}:${longitude}:${date || 'current'}`;
  }
}
