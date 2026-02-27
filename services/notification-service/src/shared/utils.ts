import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown, message = 'Success'): void {
  res.status(200).json({ success: true, statusCode: 200, message, data });
}

export function sendCreated(res: Response, data: unknown, message = 'Created'): void {
  res.status(201).json({ success: true, statusCode: 201, message, data });
}

export async function verifyServiceToken(token: string): Promise<{
  id: string;
  email: string;
  role: string;
}> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      const payload = decoded as { id: string; email: string; role: string };
      resolve(payload);
    });
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exponentialDelay(attempt: number, baseMs = 500): number {
  return Math.pow(2, attempt) * baseMs;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}