import * as crypto from 'crypto';

export class HashUtil {
  static generateHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static hashPassword(password: string, salt: string): string {
    return this.generateHash(password + salt);
  }

  static generateUUID(): string {
    return crypto.randomUUID();
  }

  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
