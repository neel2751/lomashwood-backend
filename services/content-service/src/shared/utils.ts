import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { ZodType, ZodError } from 'zod';
import { BLOG, PATTERNS } from './constants';
import type { Slug, ISODateString, BlogCategory } from './types';



export function generateSlug(input: string): Slug {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function uniquifySlug(slug: Slug): Slug {
  const suffix = randomBytes(2).toString('hex');
  return `${slug}-${suffix}`;
}

export function isValidSlug(slug: string): boolean {
  return PATTERNS.SLUG.test(slug) && slug.length >= 2 && slug.length <= 200;
}



export function calculateReadTime(htmlContent: string): number {
  const text = stripHtml(htmlContent);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / BLOG.WORDS_PER_MINUTE));
}



export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  const plain = stripHtml(text);
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength - 3).trimEnd() + '...';
}

export function generateExcerpt(htmlContent: string, maxLength = 300): string {
  return truncate(htmlContent, maxLength);
}



export function buildCanonicalUrl(baseUrl: string, ...segments: string[]): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanSegments = segments
    .map((s) => s.replace(/^\/|\/$/g, ''))
    .filter(Boolean);
  return [cleanBase, ...cleanSegments].join('/');
}

export function getBlogCanonicalPath(slug: Slug, _category?: BlogCategory): string {
  return `/inspiration/${slug}`;
}

export function getProductCanonicalPath(slug: Slug, category: string): string {
  const base = category === 'KITCHEN' ? 'kitchens' : 'bedrooms';
  return `/${base}/${slug}`;
}



export function toHumanLabel(str: string): string {
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normaliseTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean))];
}



export function nowIso(): ISODateString {
  return new Date().toISOString();
}

export function isValidIsoDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isScheduledInFuture(scheduledAt: ISODateString): boolean {
  return new Date(scheduledAt) > new Date();
}

export function toSitemapDate(date: Date): string {
  return date.toISOString().split('T')[0];
}



export function hashContent(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

export function shortId(): string {
  return randomBytes(4).toString('hex');
}



export function sanitiseFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const base = filename
    .slice(0, filename.lastIndexOf('.'))
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return ext ? `${base}.${ext}` : base;
}

export function getFileExtension(filename: string): string {
  return (filename.split('.').pop() ?? '').toLowerCase();
}



export function buildCacheKey(prefix: string, ...parts: string[]): string {
  return ['content', prefix, ...parts].join(':');
}



export function isValidUuid(value: string): boolean {
  return PATTERNS.UUID.test(value);
}

export function isValidHexColor(value: string): boolean {
  return PATTERNS.HEX_COLOR.test(value);
}

export function isValidUrl(value: string): boolean {
  return PATTERNS.URL.test(value);
}



class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';
  public readonly details: unknown;

  constructor(errors: unknown) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.details = errors;
  }
}

function parseWithSchema<Out>(
  schema: ZodType<Out, any, any>,
  data: unknown,
): Out {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.flatten());
    }
    throw error;
  }
}

export function validateBody<Out>(schema: ZodType<Out, any, any>, body: unknown): Out {
  return parseWithSchema(schema, body);
}

export function validateQuery<Out>(schema: ZodType<Out, any, any>, query: unknown): Out {
  return parseWithSchema(schema, query);
}

export function validateParams<Out>(schema: ZodType<Out, any, any>, params: unknown): Out {
  return parseWithSchema(schema, params);
}



/**
 * 200 OK — successful read/update response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    meta: { timestamp: new Date().toISOString() },
  });
}

/**
 * 201 Created — successful resource creation response.
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'Created successfully',
): void {
  res.status(201).json({
    success: true,
    message,
    data,
    meta: { timestamp: new Date().toISOString() },
  });
}

/**
 * 204 No Content — successful deletion / void response.
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * 400 Bad Request — generic error response helper.
 */
export function sendBadRequest(res: Response, message = 'Bad request'): void {
  res.status(400).json({
    success: false,
    message,
    meta: { timestamp: new Date().toISOString() },
  });
}

/**
 * 404 Not Found — resource not found response.
 */
export function sendNotFound(res: Response, message = 'Not found'): void {
  res.status(404).json({
    success: false,
    message,
    meta: { timestamp: new Date().toISOString() },
  });
}