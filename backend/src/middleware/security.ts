import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { Redis } from 'ioredis';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import csrf from 'csurf';
import { ErrorHandler } from './errorHandler';

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private redis: Redis;
  private csrfProtection: any;
  private rateLimiter: any;

  private constructor() {
    this.redis = new Redis({
      host: config.database.host,
      port: config.database.port,
      password: config.database.password,
    });

    // Initialize CSRF protection
    this.csrfProtection = csrf({
      cookie: true,
      value: (req: Request) => {
        return req.headers['x-csrf-token'] as string;
      }
    });

    // Initialize rate limiter
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      handler: (req: Request, res: Response) => {
        throw new RateLimitError(
          'Too many requests from this IP',
          15 * 60,
          { ip: req.ip }
        );
      }
    });
  }

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  // Apply security headers
  public applySecurityHeaders(): RequestHandler {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https:"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
    });
  }

  // Apply CSRF protection
  public applyCSRFProtection(): RequestHandler {
    return this.csrfProtection;
  }

  // Apply rate limiting
  public applyRateLimiting(): RequestHandler {
    return this.rateLimiter;
  }

  // Apply XSS protection
  public applyXSSProtection(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    };
  }

  // Apply security headers for API responses
  public applyAPIHeaders(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      next();
    };
  }

  // Apply security headers for static files
  public applyStaticHeaders(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      next();
    };
  }

  // Apply security headers for WebSocket connections
  public applyWebSocketHeaders(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    };
  }

  // Log security events
  public async logSecurityEvent(
    req: Request,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const log = {
        timestamp: new Date().toISOString(),
        eventType,
        details,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      };

      await this.redis.rpush('security_events', JSON.stringify(log));
      await this.redis.expire('security_events', 60 * 60 * 24 * 30); // 30 days
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Get recent security events
  public async getRecentSecurityEvents(limit = 100): Promise<any[]> {
    try {
      const events = await this.redis.lrange('security_events', 0, limit - 1);
      return events.map(event => JSON.parse(event));
    } catch (error) {
      console.error('Error retrieving security events:', error);
      return [];
    }
  }

  // Clear security events
  public async clearSecurityEvents(): Promise<void> {
    try {
      await this.redis.del('security_events');
    } catch (error) {
      console.error('Error clearing security events:', error);
    }
  }
}

export const security = SecurityMiddleware.getInstance();
