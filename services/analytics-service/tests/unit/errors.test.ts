import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ServiceUnavailableError,
  ExternalServiceError,
} from '../../src/shared/errors';

describe('AppError', () => {
  it('sets code, message and statusCode', () => {
    const err = new AppError('Something broke', 500, 'CUSTOM_CODE');
    expect(err.code).toBe('CUSTOM_CODE');
    expect(err.message).toBe('Something broke');
    expect(err.statusCode).toBe(500);
  });

  it('is an instance of Error', () => {
    const err = new AppError('msg', 400, 'CODE');
    expect(err).toBeInstanceOf(Error);
  });

  it('name is AppError', () => {
    const err = new AppError('msg', 400, 'CODE');
    expect(err.name).toBe('AppError');
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404', () => {
    const err = new NotFoundError('Event', 'evt-1');
    expect(err.statusCode).toBe(404);
  });

  it('includes resource and id in message', () => {
    const err = new NotFoundError('Session', 'sess-abc');
    expect(err.message).toContain('Session');
    expect(err.message).toContain('sess-abc');
  });

  it('has code NOT_FOUND', () => {
    const err = new NotFoundError('Report', 'r-1');
    expect(err.code).toBe('NOT_FOUND');
  });
});

describe('ValidationError', () => {
  it('has statusCode 400', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
  });

  it('has code VALIDATION_ERROR', () => {
    const err = new ValidationError('Bad data');
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

describe('ConflictError', () => {
  it('has statusCode 409', () => {
    const err = new ConflictError('Slug already exists');
    expect(err.statusCode).toBe(409);
  });

  it('has code CONFLICT', () => {
    const err = new ConflictError('Duplicate');
    expect(err.code).toBe('CONFLICT');
  });
});

describe('UnauthorizedError', () => {
  it('has statusCode 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it('uses default message when none provided', () => {
    const err = new UnauthorizedError();
    expect(err.message).toBeTruthy();
  });

  it('uses custom message when provided', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('has statusCode 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it('has code FORBIDDEN', () => {
    const err = new ForbiddenError();
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ServiceUnavailableError', () => {
  it('has statusCode 503', () => {
    const err = new ServiceUnavailableError('Redis is down');
    expect(err.statusCode).toBe(503);
  });

  it('includes service name in message', () => {
    const err = new ServiceUnavailableError('Kafka is down');
    expect(err.message).toContain('Kafka');
  });
});

describe('ExternalServiceError', () => {
  it('has statusCode 502', () => {
    const err = new ExternalServiceError('twilio', 'Rate limit exceeded');
    expect(err.statusCode).toBe(502);
  });

  it('includes provider name in message', () => {
    const err = new ExternalServiceError('firebase', 'Auth failed');
    expect(err.message).toContain('firebase');
  });

  it('includes original message', () => {
    const err = new ExternalServiceError('ses', 'Sending quota exceeded');
    expect(err.message).toContain('Sending quota exceeded');
  });
});