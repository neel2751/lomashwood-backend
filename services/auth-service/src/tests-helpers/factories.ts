import { faker } from '@faker-js/faker';
import {
  User,
  Session,
  RoleEntity,
  TokenPayload,
  LoginCredentials,
  RegisterCredentials,
  AuthTokens,
  OTPRecord,
  PasswordResetToken,
  EmailVerificationToken,
  LoginHistory,
  AuditLog,
} from '../shared/types';
import { AUTH_CONSTANTS } from '../shared/constants';
import Utils from '../shared/utils';

export class UserFactory {
  static create(overrides?: Partial<User>): User {
    return {
      id: Utils.generateId(),
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password({ length: 12 }),
      name: faker.person.fullName(),
      phone: faker.phone.number({ style: 'international' }),
      role: AUTH_CONSTANTS.ROLES.CUSTOMER,
      status: AUTH_CONSTANTS.USER_STATUS.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: faker.date.past(),
      lastLoginAt: faker.date.recent(),
      lastLoginIp: faker.internet.ipv4(),
      failedLoginAttempts: 0,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      metadata: {},
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createAdmin(overrides?: Partial<User>): User {
    return this.create({
      role: AUTH_CONSTANTS.ROLES.ADMIN,
      ...overrides,
    });
  }

  static createSuperAdmin(overrides?: Partial<User>): User {
    return this.create({
      role: AUTH_CONSTANTS.ROLES.SUPER_ADMIN,
      ...overrides,
    });
  }

  static createUnverified(overrides?: Partial<User>): User {
    return this.create({
      emailVerified: false,
      emailVerifiedAt: undefined,
      status: AUTH_CONSTANTS.USER_STATUS.PENDING_VERIFICATION,
      ...overrides,
    });
  }

  static createLocked(overrides?: Partial<User>): User {
    return this.create({
      failedLoginAttempts: AUTH_CONSTANTS.LOCKOUT.MAX_FAILED_ATTEMPTS,
      lockedUntil: Utils.addMinutes(new Date(), 30),
      status: AUTH_CONSTANTS.USER_STATUS.SUSPENDED,
      ...overrides,
    });
  }

  static createDeleted(overrides?: Partial<User>): User {
    return this.create({
      status: AUTH_CONSTANTS.USER_STATUS.DELETED,
      deletedAt: faker.date.recent(),
      ...overrides,
    });
  }
}

export class SessionFactory {
  static create(overrides?: Partial<Session>): Session {
    return {
      id: Utils.generateId(),
      userId: Utils.generateId(),
      token: Utils.generateToken(64),
      refreshToken: Utils.generateToken(64),
      deviceId: Utils.generateId(),
      userAgent: faker.internet.userAgent(),
      ipAddress: faker.internet.ipv4(),
      expiresAt: Utils.addDays(new Date(), 7),
      lastActivityAt: new Date(),
      createdAt: faker.date.recent(),
      isActive: true,
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<Session>): Session[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createExpired(overrides?: Partial<Session>): Session {
    return this.create({
      expiresAt: faker.date.past(),
      isActive: false,
      ...overrides,
    });
  }

  static createForUser(userId: string, overrides?: Partial<Session>): Session {
    return this.create({
      userId,
      ...overrides,
    });
  }
}

export class RoleFactory {
  static create(overrides?: Partial<RoleEntity>): RoleEntity {
    return {
      id: Utils.generateId(),
      name: faker.word.noun().toUpperCase(),
      description: faker.lorem.sentence(),
      permissions: [
        AUTH_CONSTANTS.PERMISSIONS.USER_READ,
        AUTH_CONSTANTS.PERMISSIONS.USER_WRITE,
      ],
      isSystem: false,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<RoleEntity>): RoleEntity[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createSystemRole(overrides?: Partial<RoleEntity>): RoleEntity {
    return this.create({
      isSystem: true,
      ...overrides,
    });
  }

  static createAdminRole(overrides?: Partial<RoleEntity>): RoleEntity {
    return this.create({
      name: AUTH_CONSTANTS.ROLES.ADMIN,
      permissions: Object.values(AUTH_CONSTANTS.PERMISSIONS),
      isSystem: true,
      ...overrides,
    });
  }

  static createCustomerRole(overrides?: Partial<RoleEntity>): RoleEntity {
    return this.create({
      name: AUTH_CONSTANTS.ROLES.CUSTOMER,
      permissions: [AUTH_CONSTANTS.PERMISSIONS.USER_READ],
      isSystem: true,
      ...overrides,
    });
  }
}

export class TokenFactory {
  static createAccessToken(overrides?: Partial<TokenPayload>): TokenPayload {
    return {
      userId: Utils.generateId(),
      email: faker.internet.email().toLowerCase(),
      role: AUTH_CONSTANTS.ROLES.CUSTOMER,
      sessionId: Utils.generateId(),
      type: AUTH_CONSTANTS.TOKEN_TYPES.ACCESS,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      ...overrides,
    };
  }

  static createRefreshToken(overrides?: Partial<TokenPayload>): TokenPayload {
    return {
      userId: Utils.generateId(),
      email: faker.internet.email().toLowerCase(),
      role: AUTH_CONSTANTS.ROLES.CUSTOMER,
      sessionId: Utils.generateId(),
      type: AUTH_CONSTANTS.TOKEN_TYPES.REFRESH,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 604800,
      ...overrides,
    };
  }

  static createExpiredToken(overrides?: Partial<TokenPayload>): TokenPayload {
    return this.createAccessToken({
      iat: Math.floor(Date.now() / 1000) - 3600,
      exp: Math.floor(Date.now() / 1000) - 1800,
      ...overrides,
    });
  }
}

export class CredentialsFactory {
  static createLoginCredentials(overrides?: Partial<LoginCredentials>): LoginCredentials {
    return {
      email: faker.internet.email().toLowerCase(),
      password: 'Test@1234',
      deviceId: Utils.generateId(),
      rememberMe: false,
      ...overrides,
    };
  }

  static createRegisterCredentials(overrides?: Partial<RegisterCredentials>): RegisterCredentials {
    return {
      email: faker.internet.email().toLowerCase(),
      password: 'Test@1234',
      name: faker.person.fullName(),
      phone: faker.phone.number({ style: 'international' }),
      acceptTerms: true,
      ...overrides,
    };
  }
}

export class AuthTokensFactory {
  static create(overrides?: Partial<AuthTokens>): AuthTokens {
    return {
      accessToken: Utils.generateToken(64),
      refreshToken: Utils.generateToken(64),
      expiresIn: 900,
      tokenType: 'Bearer',
      ...overrides,
    };
  }
}

export class OTPFactory {
  static create(overrides?: Partial<OTPRecord>): OTPRecord {
    return {
      id: Utils.generateId(),
      userId: Utils.generateId(),
      otp: Utils.generateOTP(6),
      purpose: 'login',
      expiresAt: Utils.addMinutes(new Date(), 5),
      attempts: 0,
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createExpired(overrides?: Partial<OTPRecord>): OTPRecord {
    return this.create({
      expiresAt: faker.date.past(),
      ...overrides,
    });
  }

  static createVerified(overrides?: Partial<OTPRecord>): OTPRecord {
    return this.create({
      verifiedAt: new Date(),
      ...overrides,
    });
  }

  static createForUser(userId: string, overrides?: Partial<OTPRecord>): OTPRecord {
    return this.create({
      userId,
      ...overrides,
    });
  }
}

export class PasswordResetTokenFactory {
  static create(overrides?: Partial<PasswordResetToken>): PasswordResetToken {
    return {
      userId: Utils.generateId(),
      token: Utils.generateToken(32),
      expiresAt: Utils.addHours(new Date(), 1),
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createExpired(overrides?: Partial<PasswordResetToken>): PasswordResetToken {
    return this.create({
      expiresAt: faker.date.past(),
      ...overrides,
    });
  }

  static createUsed(overrides?: Partial<PasswordResetToken>): PasswordResetToken {
    return this.create({
      usedAt: new Date(),
      ...overrides,
    });
  }

  static createForUser(userId: string, overrides?: Partial<PasswordResetToken>): PasswordResetToken {
    return this.create({
      userId,
      ...overrides,
    });
  }
}

export class EmailVerificationTokenFactory {
  static create(overrides?: Partial<EmailVerificationToken>): EmailVerificationToken {
    return {
      userId: Utils.generateId(),
      token: Utils.generateToken(32),
      email: faker.internet.email().toLowerCase(),
      expiresAt: Utils.addHours(new Date(), 24),
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createExpired(overrides?: Partial<EmailVerificationToken>): EmailVerificationToken {
    return this.create({
      expiresAt: faker.date.past(),
      ...overrides,
    });
  }

  static createVerified(overrides?: Partial<EmailVerificationToken>): EmailVerificationToken {
    return this.create({
      verifiedAt: new Date(),
      ...overrides,
    });
  }

  static createForUser(
    userId: string,
    email: string,
    overrides?: Partial<EmailVerificationToken>
  ): EmailVerificationToken {
    return this.create({
      userId,
      email,
      ...overrides,
    });
  }
}

export class LoginHistoryFactory {
  static create(overrides?: Partial<LoginHistory>): LoginHistory {
    return {
      id: Utils.generateId(),
      userId: Utils.generateId(),
      loginMethod: AUTH_CONSTANTS.LOGIN_METHODS.EMAIL,
      ipAddress: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      deviceId: Utils.generateId(),
      status: 'success',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<LoginHistory>): LoginHistory[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createFailed(overrides?: Partial<LoginHistory>): LoginHistory {
    return this.create({
      status: 'failure',
      failureReason: 'Invalid credentials',
      ...overrides,
    });
  }

  static createForUser(userId: string, overrides?: Partial<LoginHistory>): LoginHistory {
    return this.create({
      userId,
      ...overrides,
    });
  }
}

export class AuditLogFactory {
  static create(overrides?: Partial<AuditLog>): AuditLog {
    return {
      id: Utils.generateId(),
      userId: Utils.generateId(),
      action: AUTH_CONSTANTS.AUDIT.ACTIONS.LOGIN,
      resource: 'user',
      resourceId: Utils.generateId(),
      changes: {},
      ipAddress: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      status: 'success',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<AuditLog>): AuditLog[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createFailed(overrides?: Partial<AuditLog>): AuditLog {
    return this.create({
      status: 'failure',
      errorMessage: 'Operation failed',
      ...overrides,
    });
  }

  static createForUser(userId: string, overrides?: Partial<AuditLog>): AuditLog {
    return this.create({
      userId,
      ...overrides,
    });
  }
}

export const Factories = {
  User: UserFactory,
  Session: SessionFactory,
  Role: RoleFactory,
  Token: TokenFactory,
  Credentials: CredentialsFactory,
  AuthTokens: AuthTokensFactory,
  OTP: OTPFactory,
  PasswordResetToken: PasswordResetTokenFactory,
  EmailVerificationToken: EmailVerificationTokenFactory,
  LoginHistory: LoginHistoryFactory,
  AuditLog: AuditLogFactory,
};

export default Factories;