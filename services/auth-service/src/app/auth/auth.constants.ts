

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60, 
  REFRESH_TOKEN: 7 * 24 * 60 * 60, 
  EMAIL_VERIFICATION: 24 * 60 * 60, 
  PASSWORD_RESET: 60 * 60, 
  TWO_FACTOR_CODE: 5 * 60, 
  REMEMBER_ME_TOKEN: 30 * 24 * 60 * 60, 
} as const;


export const TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  TWO_FACTOR: 'two_factor',
} as const;


export const ACCOUNT_LOCK = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_DURATION_MINUTES: 30,
  RESET_ATTEMPTS_AFTER_HOURS: 24,
  PROGRESSIVE_LOCK_MULTIPLIER: 2,
} as const;


export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  COMMON_PASSWORDS_CHECK: true,
} as const;



export const PASSWORD_POLICY_MESSAGES = {
  MIN_LENGTH: `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`,
  MAX_LENGTH: `Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`,
  REQUIRE_UPPERCASE: 'Password must contain at least one uppercase letter',
  REQUIRE_LOWERCASE: 'Password must contain at least one lowercase letter',
  REQUIRE_NUMBER: 'Password must contain at least one number',
  REQUIRE_SPECIAL_CHAR: 'Password must contain at least one special character',
  COMMON_PASSWORD: 'Password is too common. Please choose a stronger password',
  CONTAINS_EMAIL: 'Password must not contain your email address',
  CONTAINS_NAME: 'Password must not contain your name',
} as const;


export const COMMON_WEAK_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  'qwerty123',
  'abc123456',
  'password1',
  'letmein',
  'welcome',
  'admin123',
  'user123',
] as const;


export const SESSION_CONFIG = {
  MAX_ACTIVE_SESSIONS: 5,
  EXTEND_ON_ACTIVITY: true,
  EXTEND_BY_MINUTES: 15,
  CLEANUP_EXPIRED_INTERVAL_HOURS: 24,
  REMEMBER_ME_DURATION_DAYS: 30,
} as const;


export const TWO_FACTOR_CONFIG = {
  ISSUER_NAME: 'Lomash Wood',
  CODE_LENGTH: 6,
  BACKUP_CODES_COUNT: 10,
  BACKUP_CODE_LENGTH: 8,
  MAX_VERIFY_ATTEMPTS: 3,
  WINDOW: 1, 
  ALGORITHM: 'sha1',
} as const;


export const EMAIL_VERIFICATION_CONFIG = {
  RESEND_COOLDOWN_MINUTES: 5,
  MAX_RESEND_ATTEMPTS_PER_DAY: 3,
  TOKEN_LENGTH: 32,
} as const;


export const PASSWORD_RESET_CONFIG = {
  RESEND_COOLDOWN_MINUTES: 5,
  MAX_REQUESTS_PER_DAY: 3,
  TOKEN_LENGTH: 32,
} as const;

export const RATE_LIMIT = {
  LOGIN: {
    MAX_ATTEMPTS: 5,
    WINDOW_MINUTES: 15,
    BLOCK_DURATION_MINUTES: 30,
  },
  REGISTER: {
    MAX_ATTEMPTS: 3,
    WINDOW_MINUTES: 60,
    BLOCK_DURATION_MINUTES: 60,
  },
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MINUTES: 60,
    BLOCK_DURATION_MINUTES: 60,
  },
  EMAIL_VERIFICATION: {
    MAX_ATTEMPTS: 3,
    WINDOW_MINUTES: 60,
    BLOCK_DURATION_MINUTES: 60,
  },
  TWO_FACTOR: {
    MAX_ATTEMPTS: 3,
    WINDOW_MINUTES: 15,
    BLOCK_DURATION_MINUTES: 30,
  },
} as const;


export const ROLE_HIERARCHY = {
  CUSTOMER: 0,
  CONSULTANT: 1,
  SALES_MANAGER: 2,
  CONTENT_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
} as const;


export const DEFAULT_USER_METADATA = {
  emailNotifications: true,
  smsNotifications: false,
  marketingEmails: false,
  newsletterSubscription: false,
  language: 'en',
  timezone: 'Asia/Kolkata',
} as const;


export const AUTH_ERROR_MESSAGES = {
  
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in',
  ACCOUNT_LOCKED: 'Your account has been locked due to too many failed login attempts',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support',
  ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support',
  TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again later',

  
  USER_ALREADY_EXISTS: 'An account with this email already exists',
  EMAIL_ALREADY_REGISTERED: 'This email address is already registered',
  PHONE_ALREADY_REGISTERED: 'This phone number is already registered',
  INVALID_EMAIL_FORMAT: 'Invalid email address format',
  INVALID_PHONE_FORMAT: 'Invalid phone number format',

  
  INVALID_TOKEN: 'Invalid or malformed token',
  EXPIRED_TOKEN: 'Token has expired',
  TOKEN_NOT_FOUND: 'Token not found or already used',
  TOKEN_ALREADY_USED: 'Token has already been used',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',

  
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  SESSION_INVALID: 'Invalid session. Please login again',
  SESSION_NOT_FOUND: 'Session not found',
  MAX_SESSIONS_REACHED: 'Maximum number of active sessions reached',

  
  WEAK_PASSWORD: 'Password does not meet security requirements',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INCORRECT_PASSWORD: 'Current password is incorrect',
  PASSWORD_RECENTLY_USED: 'Password was recently used. Please choose a different one',
  PASSWORD_CONTAINS_EMAIL: 'Password must not contain your email address',
  PASSWORD_CONTAINS_NAME: 'Password must not contain your name',
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`,

  
  TWO_FACTOR_REQUIRED: 'Two-factor authentication code is required',
  INVALID_TWO_FACTOR_CODE: 'Invalid two-factor authentication code',
  TWO_FACTOR_ALREADY_ENABLED: 'Two-factor authentication is already enabled',
  TWO_FACTOR_NOT_ENABLED: 'Two-factor authentication is not enabled',
  TWO_FACTOR_SETUP_INCOMPLETE: 'Two-factor authentication setup is incomplete',

  
  USER_NOT_FOUND: 'User not found',
  USER_DELETED: 'User account has been deleted',

  
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

  
  INTERNAL_SERVER_ERROR: 'An internal server error occurred',
  VALIDATION_ERROR: 'Validation error',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
} as const;


export const AUTH_SUCCESS_MESSAGES = {
  
  REGISTRATION_SUCCESS: 'Registration successful. Please check your email to verify your account',

  
  LOGIN_SUCCESS: 'Login successful',

  
  EMAIL_VERIFICATION_SENT: 'Verification email has been sent',
  EMAIL_VERIFIED: 'Email verified successfully',

  
  PASSWORD_RESET_EMAIL_SENT: 'Password reset instructions have been sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
  PASSWORD_CHANGED: 'Password has been changed successfully',

  
  LOGOUT_SUCCESS: 'Logged out successfully',
  ALL_SESSIONS_LOGOUT_SUCCESS: 'All sessions have been logged out successfully',

  
  TWO_FACTOR_ENABLED: 'Two-factor authentication has been enabled successfully',
  TWO_FACTOR_DISABLED: 'Two-factor authentication has been disabled successfully',
  TWO_FACTOR_VERIFIED: 'Two-factor authentication code verified successfully',

  
  TOKEN_REFRESHED: 'Token refreshed successfully',

  
  ACCOUNT_UPDATED: 'Account updated successfully',
  ACCOUNT_DELETED: 'Account deleted successfully',
} as const;


export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email-verification',
  EMAIL_VERIFIED: 'email-verified',
  PASSWORD_RESET: 'password-reset',
  PASSWORD_CHANGED: 'password-changed',
  TWO_FACTOR_ENABLED: 'two-factor-enabled',
  TWO_FACTOR_DISABLED: 'two-factor-disabled',
  ACCOUNT_LOCKED: 'account-locked',
  SUSPICIOUS_LOGIN: 'suspicious-login',
  NEW_DEVICE_LOGIN: 'new-device-login',
} as const;


export const EMAIL_SUBJECTS = {
  WELCOME: 'Welcome to Lomash Wood',
  EMAIL_VERIFICATION: 'Verify Your Email Address',
  EMAIL_VERIFIED: 'Email Verified Successfully',
  PASSWORD_RESET: 'Reset Your Password',
  PASSWORD_CHANGED: 'Your Password Has Been Changed',
  TWO_FACTOR_ENABLED: 'Two-Factor Authentication Enabled',
  TWO_FACTOR_DISABLED: 'Two-Factor Authentication Disabled',
  ACCOUNT_LOCKED: 'Your Account Has Been Locked',
  SUSPICIOUS_LOGIN: 'Suspicious Login Attempt Detected',
  NEW_DEVICE_LOGIN: 'New Device Login Detected',
} as const;


export const AUTH_EVENTS = {
  
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  USER_EMAIL_VERIFIED: 'user.email_verified',
  USER_PASSWORD_CHANGED: 'user.password_changed',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_TWO_FACTOR_ENABLED: 'user.two_factor_enabled',
  USER_TWO_FACTOR_DISABLED: 'user.two_factor_disabled',
  USER_ACCOUNT_LOCKED: 'user.account_locked',
  USER_ACCOUNT_UNLOCKED: 'user.account_unlocked',
  USER_ACCOUNT_SUSPENDED: 'user.account_suspended',
  USER_ACCOUNT_DELETED: 'user.account_deleted',
  USER_UPDATED: 'user.updated',

  
  SESSION_CREATED: 'session.created',
  SESSION_REFRESHED: 'session.refreshed',
  SESSION_EXPIRED: 'session.expired',
  SESSION_REVOKED: 'session.revoked',

  
  FAILED_LOGIN_ATTEMPT: 'security.failed_login_attempt',
  SUSPICIOUS_LOGIN: 'security.suspicious_login',
  NEW_DEVICE_LOGIN: 'security.new_device_login',
  PASSWORD_RESET_REQUESTED: 'security.password_reset_requested',
  EMAIL_VERIFICATION_REQUESTED: 'security.email_verification_requested',
} as const;


export const CACHE_KEYS = {
  USER: (userId: string) => `user:${userId}`,
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER_SESSIONS: (userId: string) => `user:${userId}:sessions`,
  REFRESH_TOKEN: (token: string) => `refresh_token:${token}`,
  EMAIL_VERIFICATION_TOKEN: (token: string) => `email_verification:${token}`,
  PASSWORD_RESET_TOKEN: (token: string) => `password_reset:${token}`,
  TWO_FACTOR_CODE: (userId: string) => `2fa:${userId}`,
  FAILED_LOGIN_ATTEMPTS: (identifier: string) => `failed_login:${identifier}`,
  RATE_LIMIT: (identifier: string, action: string) => `rate_limit:${action}:${identifier}`,
  TOKEN_BLACKLIST: (token: string) => `blacklist:${token}`,
} as const;


export const CACHE_TTL = {
  USER: 60 * 15, 
  SESSION: 60 * 60 * 24 * 7, 
  REFRESH_TOKEN: 60 * 60 * 24 * 7, 
  EMAIL_VERIFICATION_TOKEN: 60 * 60 * 24, 
  PASSWORD_RESET_TOKEN: 60 * 60, 
  TWO_FACTOR_CODE: 60 * 5, 
  FAILED_LOGIN_ATTEMPTS: 60 * 60, 
  RATE_LIMIT: 60 * 60, 
  TOKEN_BLACKLIST: 60 * 60 * 24, 
} as const;


export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;


export const JWT_CONFIG = {
  ALGORITHM: 'HS256' as const,
  ISSUER: 'lomash-wood',
  AUDIENCE: 'lomash-wood-api',
  CLOCK_TOLERANCE: 10, 
} as const;


export const COOKIE_CONFIG = {
  REFRESH_TOKEN_NAME: 'refresh_token',
  ACCESS_TOKEN_NAME: 'access_token',
  DOMAIN: process.env['COOKIE_DOMAIN'] || 'localhost',  
  SECURE: process.env['NODE_ENV'] === 'production',      
  HTTP_ONLY: true,
  SAME_SITE: 'strict' as const,
  PATH: '/',
} as const;


export const API_VERSION = {
  V1: '/v1',
  CURRENT: '/v1',
} as const;


export const API_ENDPOINTS = {
  
  REGISTER: `${API_VERSION.V1}/auth/register`,
  LOGIN: `${API_VERSION.V1}/auth/login`,
  LOGOUT: `${API_VERSION.V1}/auth/logout`,
  REFRESH: `${API_VERSION.V1}/auth/refresh`,
  ME: `${API_VERSION.V1}/auth/me`,

  
  VERIFY_EMAIL: `${API_VERSION.V1}/auth/verify-email`,
  RESEND_VERIFICATION: `${API_VERSION.V1}/auth/resend-verification`,

  
  FORGOT_PASSWORD: `${API_VERSION.V1}/auth/forgot-password`,
  RESET_PASSWORD: `${API_VERSION.V1}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_VERSION.V1}/auth/change-password`,

  
  TWO_FACTOR_SETUP: `${API_VERSION.V1}/auth/2fa/setup`,
  TWO_FACTOR_VERIFY: `${API_VERSION.V1}/auth/2fa/verify`,
  TWO_FACTOR_DISABLE: `${API_VERSION.V1}/auth/2fa/disable`,

  
  SESSIONS: `${API_VERSION.V1}/auth/sessions`,
  SESSION_REVOKE: `${API_VERSION.V1}/auth/sessions/:id/revoke`,

  
  HEALTH: '/health',
  READY: '/ready',
} as const;


export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
} as const;


export const SECURITY_HEADERS = {
  STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  X_FRAME_OPTIONS: 'DENY',
  X_XSS_PROTECTION: '1; mode=block',
  CONTENT_SECURITY_POLICY: "default-src 'self'",
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
} as const;

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;


export const AUDIT_ACTIONS = {
  
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_EMAIL_VERIFIED: 'USER_EMAIL_VERIFIED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  USER_2FA_ENABLED: 'USER_2FA_ENABLED',
  USER_2FA_DISABLED: 'USER_2FA_DISABLED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',

  
  FAILED_LOGIN: 'FAILED_LOGIN',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SESSION_REVOKED: 'SESSION_REVOKED',
} as const;


export const TIMEZONE = {
  DEFAULT: 'Asia/Kolkata',
  UTC: 'UTC',
} as const;


export const LOCALE = {
  DEFAULT: 'en',
  SUPPORTED: ['en', 'hi'],
} as const;

export const FEATURE_FLAGS = {
  TWO_FACTOR_AUTH_ENABLED: true,
  EMAIL_VERIFICATION_REQUIRED: true,
  PHONE_VERIFICATION_ENABLED: false,
  SOCIAL_LOGIN_ENABLED: false,
  REMEMBER_ME_ENABLED: true,
  ACCOUNT_DELETION_ENABLED: true,
  PASSWORD_HISTORY_CHECK: false,
  SUSPICIOUS_LOGIN_DETECTION: true,
} as const;


export const ENV_CONFIG = {
  DEVELOPMENT: {
    LOG_LEVEL: LOG_LEVELS.DEBUG,
    RATE_LIMIT_ENABLED: false,
    EMAIL_VERIFICATION_REQUIRED: false,
  },
  STAGING: {
    LOG_LEVEL: LOG_LEVELS.INFO,
    RATE_LIMIT_ENABLED: true,
    EMAIL_VERIFICATION_REQUIRED: true,
  },
  PRODUCTION: {
    LOG_LEVEL: LOG_LEVELS.WARN,
    RATE_LIMIT_ENABLED: true,
    EMAIL_VERIFICATION_REQUIRED: true,
  },
} as const;