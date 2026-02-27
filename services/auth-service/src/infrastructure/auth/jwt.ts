
interface JwtSignOptions {
  expiresIn?: string | number;
  issuer?: string;
  audience?: string | string[];
}

interface JwtVerifyOptions {
  issuer?: string;
  audience?: string | string[];
}

class TokenExpiredError extends Error {
  constructor() { super('TokenExpiredError'); this.name = 'TokenExpiredError'; }
}

class JsonWebTokenError extends Error {
  constructor(msg: string) { super(msg); this.name = 'JsonWebTokenError'; }
}

const jwt = {
  TokenExpiredError,
  JsonWebTokenError,
  sign: (_payload: object, _secret: string, _options?: JwtSignOptions): string => {
    throw new Error('jsonwebtoken not installed — run: npm install jsonwebtoken');
  },
  verify: (_token: string, _secret: string, _options?: JwtVerifyOptions): unknown => {
    throw new Error('jsonwebtoken not installed — run: npm install jsonwebtoken');
  },
  decode: (_token: string): unknown => {
    throw new Error('jsonwebtoken not installed — run: npm install jsonwebtoken');
  },
};


const config = {
  jwt: {
    secret:        process.env['JWT_ACCESS_SECRET']  ?? '',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] ?? '',
    issuer:        process.env['JWT_ISSUER']         ?? 'lomash-wood-auth',
    audience:      process.env['JWT_AUDIENCE']       ?? 'lomash-wood-api',
  },
};


const redisClient = {
  set: async (_key: string, _value: string, _ttl?: number): Promise<void> => {},
  get: async <T = string>(_key: string): Promise<T | null> => null,
  exists: async (_key: string): Promise<boolean> => false,
  keys: async (_pattern: string): Promise<string[]> => [],
};


const RedisKeys = {
  auth: {
    token:        (t: string) => `auth:token:${t}`,
    refreshToken: (t: string) => `auth:refresh:${t}`,
    blacklist:    (t: string) => `auth:blacklist:${t}`,
  },
};


export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JwtService {
  private static readonly ACCESS_TOKEN_EXPIRY         = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY        = '7d';
  private static readonly ACCESS_TOKEN_EXPIRY_SECONDS  = 15 * 60;
  private static readonly REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

  static generateAccessToken(payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): string {
    const tokenPayload: JwtPayload = { ...payload, type: 'access' };
    return jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer:    config.jwt.issuer,
      audience:  config.jwt.audience,
    });
  }

  static generateRefreshToken(payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): string {
    const tokenPayload: JwtPayload = { ...payload, type: 'refresh' };
    return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer:    config.jwt.issuer,
      audience:  config.jwt.audience,
    });
  }

  static async generateTokenPair(
    payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>
  ): Promise<TokenPair> {
    const accessToken  = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await redisClient.set(
      RedisKeys.auth.token(accessToken),
      JSON.stringify(payload),
      this.ACCESS_TOKEN_EXPIRY_SECONDS
    );

    await redisClient.set(
      RedisKeys.auth.refreshToken(refreshToken),
      JSON.stringify(payload),
      this.REFRESH_TOKEN_EXPIRY_SECONDS
    );

    return { accessToken, refreshToken, expiresIn: this.ACCESS_TOKEN_EXPIRY_SECONDS };
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer:   config.jwt.issuer,
        audience: config.jwt.audience,
      }) as JwtPayload;

      if (decoded.type !== 'access') throw new Error('Invalid token type');
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) throw new Error('Token expired');
      if (error instanceof jwt.JsonWebTokenError) throw new Error('Invalid token');
      throw error;
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer:   config.jwt.issuer,
        audience: config.jwt.audience,
      }) as JwtPayload;

      if (decoded.type !== 'refresh') throw new Error('Invalid token type');
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) throw new Error('Refresh token expired');
      if (error instanceof jwt.JsonWebTokenError) throw new Error('Invalid refresh token');
      throw error;
    }
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    return redisClient.exists(RedisKeys.auth.blacklist(token));
  }

  static async blacklistToken(token: string): Promise<void> {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) throw new Error('Invalid token');

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisClient.set(RedisKeys.auth.blacklist(token), 'true', ttl);
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) throw new Error('Refresh token has been revoked');

    const decoded = this.verifyRefreshToken(refreshToken);

    const storedToken = await redisClient.get(RedisKeys.auth.refreshToken(refreshToken));
    if (!storedToken) throw new Error('Refresh token not found');

    await this.blacklistToken(refreshToken);

    return this.generateTokenPair({
      userId:    decoded.userId,
      email:     decoded.email,
      role:      decoded.role,
      sessionId: decoded.sessionId,
    });
  }

  static async revokeUserTokens(userId: string): Promise<void> {
    const keys = await redisClient.keys(RedisKeys.auth.token('*'));
    for (const key of keys) {
      const tokenData = await redisClient.get<JwtPayload>(key);
      if (tokenData?.userId === userId) {
        const token = key.split(':').pop();
        if (token) await this.blacklistToken(token);
      }
    }

    const refreshKeys = await redisClient.keys(RedisKeys.auth.refreshToken('*'));
    for (const key of refreshKeys) {
      const tokenData = await redisClient.get<JwtPayload>(key);
      if (tokenData?.userId === userId) {
        const token = key.split(':').pop();
        if (token) await this.blacklistToken(token);
      }
    }
  }

  static async revokeSession(sessionId: string): Promise<void> {
    const keys = await redisClient.keys(RedisKeys.auth.token('*'));
    for (const key of keys) {
      const tokenData = await redisClient.get<JwtPayload>(key);
      if (tokenData?.sessionId === sessionId) {
        const token = key.split(':').pop();
        if (token) await this.blacklistToken(token);
      }
    }
  }

  static getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded?.exp || null;
  }

  static isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true;
    return expiry < Math.floor(Date.now() / 1000);
  }

  static getTokenRemainingTime(token: string): number {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return 0;
    const remaining = expiry - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : 0;
  }

  static async validateToken(token: string): Promise<JwtPayload> {
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) throw new Error('Token has been revoked');

    const decoded = this.verifyAccessToken(token);

    const storedToken = await redisClient.get(RedisKeys.auth.token(token));
    if (!storedToken) throw new Error('Token not found in store');

    return decoded;
  }

  static generatePasswordResetToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'password_reset' },
      config.jwt.secret,
      { expiresIn: '1h', issuer: config.jwt.issuer, audience: config.jwt.audience }
    );
  }

  static verifyPasswordResetToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer, audience: config.jwt.audience,
      }) as { userId: string; email: string; type: string };

      if (decoded.type !== 'password_reset') throw new Error('Invalid token type');
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      throw new Error('Invalid or expired password reset token');
    }
  }

  static generateEmailVerificationToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'email_verification' },
      config.jwt.secret,
      { expiresIn: '24h', issuer: config.jwt.issuer, audience: config.jwt.audience }
    );
  }

  static verifyEmailVerificationToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer, audience: config.jwt.audience,
      }) as { userId: string; email: string; type: string };

      if (decoded.type !== 'email_verification') throw new Error('Invalid token type');
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      throw new Error('Invalid or expired email verification token');
    }
  }
}

export const generateTokenPair  = JwtService.generateTokenPair.bind(JwtService);
export const verifyAccessToken   = JwtService.verifyAccessToken.bind(JwtService);
export const verifyRefreshToken  = JwtService.verifyRefreshToken.bind(JwtService);
export const refreshAccessToken  = JwtService.refreshAccessToken.bind(JwtService);
export const blacklistToken      = JwtService.blacklistToken.bind(JwtService);
export const validateToken       = JwtService.validateToken.bind(JwtService);
export const revokeUserTokens    = JwtService.revokeUserTokens.bind(JwtService);