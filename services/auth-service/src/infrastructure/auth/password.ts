
const bcrypt = {
  hash: async (_password: string, _saltRounds: number): Promise<string> => {
    throw new Error('bcrypt not installed — run: npm install bcrypt');
  },
  compare: async (_plain: string, _hashed: string): Promise<boolean> => {
    throw new Error('bcrypt not installed — run: npm install bcrypt');
  },
};


class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}


const logger = {
  info:  (msg: string, ...args: unknown[]) => console.info(`[INFO] ${msg}`,  ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${msg}`, ...args),
};


const SALT_ROUNDS = 12;


export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || password.length === 0) {
      throw new AppError('Password cannot be empty', 400, 'EMPTY_PASSWORD');
    }

    if (password.length > 128) {
      throw new AppError('Password too long', 400, 'PASSWORD_TOO_LONG');
    }

    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error hashing password:', error);
    throw new AppError('Failed to hash password', 500, 'HASH_ERROR');
  }
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    if (!plainPassword || !hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new AppError('Failed to compare password', 500, 'COMPARE_ERROR');
  }
}

export async function isPasswordStrong(password: string): Promise<{
  isStrong: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];

  if (password.length < 8) {
    reasons.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    reasons.push('Password must not exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    reasons.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    reasons.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    reasons.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    reasons.push('Password must contain at least one special character (@$!%*?&)');
  }

  const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein', 'welcome'];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    reasons.push('Password contains common words or patterns');
  }

  return {
    isStrong: reasons.length === 0,
    reasons,
  };
}

export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers   = '0123456789';
  const special   = '@$!%*?&';
  const allChars  = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}