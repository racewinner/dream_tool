import { config } from '../config';
import { User, UserRole, UserStatus, AuthCredentials, JwtPayload } from '../types/auth';
import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

export class AuthService {
  private static instance: AuthService;
  public redis: Redis;
  private readonly JWT_SECRET = config.jwt.secret;
  private readonly JWT_EXPIRES_IN = config.jwt.expiresIn;
  private readonly PASSWORD_SALT_ROUNDS = 10;

  private constructor() {
    this.redis = new Redis({
      host: config.database.host,
      port: config.database.port,
      password: config.database.password,
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + parseInt(this.JWT_EXPIRES_IN),
    };

    const token = sign(payload, this.JWT_SECRET);
    await this.redis.set(`token:${token}`, JSON.stringify(payload), 'EX', parseInt(this.JWT_EXPIRES_IN));
    return token;
  }

  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = verify(token, this.JWT_SECRET) as JwtPayload;
      const cachedPayload = await this.redis.get(`token:${token}`);
      
      if (!cachedPayload) {
        return null;
      }

      return JSON.parse(cachedPayload) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.PASSWORD_SALT_ROUNDS);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async generateResetToken(): Promise<string> {
    const token = uuidv4();
    await this.redis.set(`reset_token:${token}`, 'valid', 'EX', 3600); // 1 hour expiry
    return token;
  }

  async validateResetToken(token: string): Promise<boolean> {
    const isValid = await this.redis.get(`reset_token:${token}`);
    if (isValid) {
      await this.redis.del(`reset_token:${token}`);
      return true;
    }
    return false;
  }

  async invalidateToken(token: string): Promise<void> {
    await this.redis.del(`token:${token}`);
  }

  async invalidateAllTokens(userId: number): Promise<void> {
    const keys = await this.redis.keys('token:*');
    for (const key of keys) {
      const payload = await this.redis.get(key);
      if (payload) {
        const jwtPayload = JSON.parse(payload) as JwtPayload;
        if (jwtPayload.userId === userId) {
          await this.redis.del(key);
        }
      }
    }
  }

  async getPermissions(role: UserRole): Promise<string[]> {
    // This would typically come from a database
    const permissions: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: ['*'],
      [UserRole.MANAGER]: ['survey:read', 'survey:write', 'user:read'],
      [UserRole.ANALYST]: ['survey:read', 'analysis:read'],
      [UserRole.USER]: ['survey:read']
    };
    return permissions[role] || [];
  }

  async logActivity(userId: number, action: string, resource: string, details: Record<string, any>): Promise<void> {
    const log: Record<string, any> = {
      userId,
      action,
      resource,
      timestamp: new Date(),
      details
    };
    await this.redis.rpush('audit_logs', JSON.stringify(log));
  }
}
