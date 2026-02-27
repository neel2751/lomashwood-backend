import { AppError, NotFoundError, ConflictError, ForbiddenError, ValidationError, UnauthorizedError, BadRequestError } from '../../src/shared/errors';

describe('AppError', () => {
  it('should create an error with message and statusCode', () => {
    const error = new AppError('Something went wrong', 500);

    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should be an instance of Error', () => {
    const error = new AppError('Test error', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should capture stack trace', () => {
    const error = new AppError('Test', 500);

    expect(error.stack).toBeDefined();
  });

  it('should default isOperational to true', () => {
    const error = new AppError('Test', 400);

    expect(error.isOperational).toBe(true);
  });

  it('should accept custom isOperational value', () => {
    const error = new AppError('Critical', 500, false);

    expect(error.isOperational).toBe(false);
  });
});

describe('NotFoundError', () => {
  it('should create a 404 error', () => {
    const error = new NotFoundError('Customer not found');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Customer not found');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should use default message when none provided', () => {
    const error = new NotFoundError();

    expect(error.statusCode).toBe(404);
    expect(error.message).toBeTruthy();
  });
});

describe('ConflictError', () => {
  it('should create a 409 error', () => {
    const error = new ConflictError('Resource already exists');

    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Resource already exists');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ForbiddenError', () => {
  it('should create a 403 error', () => {
    const error = new ForbiddenError('Access denied');

    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Access denied');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('should create a 422 error', () => {
    const error = new ValidationError('Invalid input');

    expect(error.statusCode).toBe(422);
    expect(error.message).toBe('Invalid input');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should accept validation details', () => {
    const details = [{ field: 'email', message: 'Invalid email format' }];
    const error = new ValidationError('Validation failed', details);

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual(details);
  });
});

describe('UnauthorizedError', () => {
  it('should create a 401 error', () => {
    const error = new UnauthorizedError('Authentication required');

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication required');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should use default message when none provided', () => {
    const error = new UnauthorizedError();

    expect(error.statusCode).toBe(401);
    expect(error.message).toBeTruthy();
  });
});

describe('BadRequestError', () => {
  it('should create a 400 error', () => {
    const error = new BadRequestError('Invalid request body');

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid request body');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('Error inheritance chain', () => {
  it('should allow catching all custom errors as AppError', () => {
    const errors = [
      new NotFoundError('Not found'),
      new ConflictError('Conflict'),
      new ForbiddenError('Forbidden'),
      new ValidationError('Invalid'),
      new UnauthorizedError('Unauthorized'),
      new BadRequestError('Bad request'),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(AppError);
      expect(error.isOperational).toBe(true);
    });
  });

  it('should allow catching all custom errors as Error', () => {
    const error = new NotFoundError('Test');

    expect(error).toBeInstanceOf(Error);
  });
});