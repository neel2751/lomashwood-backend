import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser, Session, User } from '../shared/types';
import { AUTH_CONSTANTS } from '../shared/constants';
import Utils from '../shared/utils';
import Factories from './factories';

export class MockRequest {
  public body: any = {};
  public params: any = {};
  public query: any = {};
  public headers: any = {};
  public cookies: any = {};
  public user?: AuthenticatedUser;
  public session?: Session;
  public deviceId?: string;
  public ipAddress?: string;

  constructor(data?: Partial<MockRequest>) {
    Object.assign(this, data);
  }

  static create(data?: Partial<MockRequest>): Partial<Request> {
    return new MockRequest(data) as unknown as Partial<Request>;
  }

  static createAuthenticated(user?: Partial<AuthenticatedUser>): Partial<Request> {
    const authenticatedUser: AuthenticatedUser = {
      id: Utils.generateId(),
      email: 'test@example.com',
      name: 'Test User',
      role: AUTH_CONSTANTS.ROLES.CUSTOMER,
      permissions: [AUTH_CONSTANTS.PERMISSIONS.USER_READ],
      sessionId: Utils.generateId(),
      emailVerified: true,
      ...user,
    };

    return new MockRequest({
      user: authenticatedUser,
      headers: { authorization: 'Bearer mock-token' },
    }) as unknown as Partial<Request>;
  }

  static createAdmin(): Partial<Request> {
    return this.createAuthenticated({
      role: AUTH_CONSTANTS.ROLES.ADMIN,
      permissions: Object.values(AUTH_CONSTANTS.PERMISSIONS),
    });
  }
}

export class MockResponse {
  public statusCode: number = 200;
  public body: any = null;
  public headers: any = {};
  public cookies: any = {};

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  json(data: any): this {
    this.body = data;
    return this;
  }

  send(data: any): this {
    this.body = data;
    return this;
  }

  cookie(name: string, value: string, options?: any): this {
    this.cookies[name] = { value, options };
    return this;
  }

  clearCookie(name: string): this {
    delete this.cookies[name];
    return this;
  }

  setHeader(name: string, value: string): this {
    this.headers[name] = value;
    return this;
  }

  getHeader(name: string): string | undefined {
    return this.headers[name];
  }

  static create(): Partial<Response> {
    return new MockResponse() as any;
  }
}

export class MockNextFunction {
  public called: boolean = false;
  public error?: Error;

  constructor() {
    return ((error?: Error) => {
      this.called = true;
      if (error) this.error = error;
    }) as any;
  }

  static create(): NextFunction {
    return new MockNextFunction() as any;
  }
}

export class PrismaClientMock {
  public user = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  };

  public session = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  };

  public role = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  public passwordResetToken = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };

  public emailVerificationToken = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  public loginHistory = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  public auditLog = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  $transaction = jest.fn((callback: (tx: this) => unknown) => callback(this));
  $disconnect = jest.fn();
  $connect = jest.fn();

  static create(): PrismaClientMock {
    return new PrismaClientMock();
  }
}

export class RedisClientMock {
  public data: Map<string, string> = new Map();

  get = jest.fn(async (key: string) => {
    return this.data.get(key) ?? null;
  });

  // ─── FIX 2: prefix unused params with '_' to suppress declared-but-never-read ───
  set = jest.fn(async (key: string, value: string, _options?: any) => {
    this.data.set(key, value);
    return 'OK';
  });

  setex = jest.fn(async (key: string, _seconds: number, value: string) => {
    this.data.set(key, value);
    return 'OK';
  });

  del = jest.fn(async (key: string) => {
    const existed = this.data.has(key);
    this.data.delete(key);
    return existed ? 1 : 0;
  });

  exists = jest.fn(async (key: string) => {
    return this.data.has(key) ? 1 : 0;
  });

  expire = jest.fn(async (key: string, _seconds: number) => {
    return this.data.has(key) ? 1 : 0;
  });

  ttl = jest.fn(async (key: string) => {
    return this.data.has(key) ? 3600 : -2;
  });

  keys = jest.fn(async (pattern: string) => {
    return Array.from(this.data.keys()).filter(key =>
      key.includes(pattern.replace('*', ''))
    );
  });

  flushall = jest.fn(async () => {
    this.data.clear();
    return 'OK';
  });

  ping = jest.fn(async () => 'PONG');

  static create(): RedisClientMock {
    return new RedisClientMock();
  }

  clear(): void {
    this.data.clear();
    jest.clearAllMocks();
  }
}

export class EventProducerMock {
  public publishedEvents: Array<{
    topic: string;
    key: string;
    value: any;
    headers?: Record<string, string>;
  }> = [];

  publish = jest.fn(async (event: any) => {
    this.publishedEvents.push(event);
  });

  static create(): EventProducerMock {
    return new EventProducerMock();
  }

  clear(): void {
    this.publishedEvents = [];
    jest.clearAllMocks();
  }

  getEventsByTopic(topic: string): any[] {
    return this.publishedEvents.filter(e => e.topic === topic);
  }

  getLastEvent(): any {
    return this.publishedEvents[this.publishedEvents.length - 1];
  }
}

export class EmailClientMock {
  public sentEmails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }> = [];

  sendEmail = jest.fn(async (params: any) => {
    this.sentEmails.push(params);
    return { messageId: Utils.generateId() };
  });

  static create(): EmailClientMock {
    return new EmailClientMock();
  }

  clear(): void {
    this.sentEmails = [];
    jest.clearAllMocks();
  }

  getEmailsSentTo(email: string): any[] {
    return this.sentEmails.filter(e => e.to === email);
  }

  getLastEmail(): any {
    return this.sentEmails[this.sentEmails.length - 1];
  }
}

export class JWTServiceMock {
  // ─── FIX 3: prefix unused 'secret' and 'options' params with '_' ───
  sign = jest.fn((payload: any, _secret: string, _options?: any) => {
    return `mock.jwt.token.${payload.userId}`;
  });

  verify = jest.fn((_token: string, _secret: string) => {
    return {
      userId: Utils.generateId(),
      email: 'test@example.com',
      role: AUTH_CONSTANTS.ROLES.CUSTOMER,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
  });

  decode = jest.fn((_token: string) => {
    return {
      userId: Utils.generateId(),
      email: 'test@example.com',
      role: AUTH_CONSTANTS.ROLES.CUSTOMER,
    };
  });

  static create(): JWTServiceMock {
    return new JWTServiceMock();
  }
}

export class PasswordServiceMock {
  hash = jest.fn(async (password: string) => {
    return `hashed_${password}`;
  });

  compare = jest.fn(async (password: string, hash: string) => {
    return hash === `hashed_${password}`;
  });

  static create(): PasswordServiceMock {
    return new PasswordServiceMock();
  }
}

export class LoggerMock {
  info = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();

  static create(): LoggerMock {
    return new LoggerMock();
  }

  clear(): void {
    jest.clearAllMocks();
  }
}

export class AuthRepositoryMock {
  findUserById = jest.fn();
  findUserByEmail = jest.fn();
  createUser = jest.fn();
  updateUser = jest.fn();
  deleteUser = jest.fn();
  findUsers = jest.fn();
  countUsers = jest.fn();

  static create(): AuthRepositoryMock {
    return new AuthRepositoryMock();
  }
}

export class SessionRepositoryMock {
  findSessionById = jest.fn();
  findSessionByToken = jest.fn();
  createSession = jest.fn();
  updateSession = jest.fn();
  deleteSession = jest.fn();
  deleteUserSessions = jest.fn();
  findUserSessions = jest.fn();
  countUserSessions = jest.fn();

  static create(): SessionRepositoryMock {
    return new SessionRepositoryMock();
  }
}

export class RoleRepositoryMock {
  findRoleById = jest.fn();
  findRoleByName = jest.fn();
  createRole = jest.fn();
  updateRole = jest.fn();
  deleteRole = jest.fn();
  findRoles = jest.fn();

  static create(): RoleRepositoryMock {
    return new RoleRepositoryMock();
  }
}

export const createMockUser = (overrides?: Partial<User>): User => {
  return Factories.User.create(overrides);
};

export const createMockSession = (overrides?: Partial<Session>): Session => {
  return Factories.Session.create(overrides);
};

export const createMockAuthenticatedUser = (
  overrides?: Partial<AuthenticatedUser>
): AuthenticatedUser => {
  return {
    id: Utils.generateId(),
    email: 'test@example.com',
    name: 'Test User',
    role: AUTH_CONSTANTS.ROLES.CUSTOMER,
    permissions: [AUTH_CONSTANTS.PERMISSIONS.USER_READ],
    sessionId: Utils.generateId(),
    emailVerified: true,
    ...overrides,
  };
};

export const Mocks = {
  Request: MockRequest,
  Response: MockResponse,
  NextFunction: MockNextFunction,
  PrismaClient: PrismaClientMock,
  RedisClient: RedisClientMock,
  EventProducer: EventProducerMock,
  EmailClient: EmailClientMock,
  JWTService: JWTServiceMock,
  PasswordService: PasswordServiceMock,
  Logger: LoggerMock,
  AuthRepository: AuthRepositoryMock,
  SessionRepository: SessionRepositoryMock,
  RoleRepository: RoleRepositoryMock,
  createUser: createMockUser,
  createSession: createMockSession,
  createAuthenticatedUser: createMockAuthenticatedUser,
};

export default Mocks;