import { env } from '@config/env';


export const betterAuthConfig = {
  secret:        env.BETTER_AUTH_SECRET,
  baseURL:       env.BETTER_AUTH_URL,
  cookieName:    env.BETTER_AUTH_COOKIE_NAME,
  sessionExpiry: env.BETTER_AUTH_SESSION_EXPIRY,
  cookieSecure:  env.BETTER_AUTH_COOKIE_SECURE,
} as const;


export const jwtConfig = {
  accessSecret:  env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiry:  env.JWT_ACCESS_EXPIRY,
  refreshExpiry: env.JWT_REFRESH_EXPIRY,
  resetExpiry:   env.JWT_RESET_EXPIRY,
  verifyExpiry:  env.JWT_VERIFY_EXPIRY,
  issuer:        env.JWT_ISSUER,
  audience:      env.JWT_AUDIENCE,
} as const;


export const passwordConfig = {
  saltRounds: env.BCRYPT_SALT_ROUNDS,
} as const;


export const otpConfig = {
  appName:        env.OTP_APP_NAME,
  window:         env.OTP_WINDOW,
  step:           env.OTP_STEP,
  digits:         env.OTP_DIGITS,
  emailOtpExpiry: env.EMAIL_OTP_EXPIRY,
} as const;


export const cookieConfig = {
  domain:   env.COOKIE_DOMAIN,
  sameSite: env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
  maxAge:   env.COOKIE_MAX_AGE,
  httpOnly: env.COOKIE_HTTP_ONLY,
  secure:   env.COOKIE_SECURE,
  secret:   env.COOKIE_SECRET,
} as const;