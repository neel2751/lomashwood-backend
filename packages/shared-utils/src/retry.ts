export type RetryableError = Error & { readonly isRetryable?: boolean };

export interface RetryOptions {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
  readonly jitter: boolean;
  readonly shouldRetry?: ((error: Error, attempt: number) => boolean) | undefined;
  readonly onRetry?: ((error: Error, attempt: number, delayMs: number) => void) | undefined;
}

export interface RetryResult<T> {
  readonly value: T;
  readonly attempts: number;
  readonly totalDurationMs: number;
}

export interface CircuitBreakerOptions {
  readonly failureThreshold: number;
  readonly successThreshold: number;
  readonly timeoutMs: number;
  readonly monitorWindowMs: number;
  readonly onOpen?: (() => void) | undefined;
  readonly onClose?: (() => void) | undefined;
  readonly onHalfOpen?: (() => void) | undefined;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreakerOpenError extends Error {
  public override readonly name = 'CircuitBreakerOpenError';

  public constructor(service: string) {
    super(`Circuit breaker is OPEN for service: ${service}`);
  }
}

export class MaxRetriesExceededError extends Error {
  public override readonly name = 'MaxRetriesExceededError';
  public readonly attempts: number;
  public readonly lastError: Error;

  public constructor(attempts: number, lastError: Error) {
    super(`Max retries exceeded after ${attempts} attempts: ${lastError.message}`);
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
};

function calculateDelay(
  attempt: number,
  options: RetryOptions,
): number {
  const exponential = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  const capped = Math.min(exponential, options.maxDelayMs);
  if (!options.jitter) {
    return capped;
  }
  return Math.floor(capped * (0.5 + Math.random() * 0.5));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions> | undefined,
): Promise<RetryResult<T>> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const value = await fn();
      return {
        value,
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const shouldRetry = opts.shouldRetry !== undefined
        ? opts.shouldRetry(lastError, attempt)
        : isRetryableError(lastError);

      if (!shouldRetry || attempt === opts.maxAttempts) {
        throw attempt === opts.maxAttempts
          ? new MaxRetriesExceededError(attempt, lastError)
          : lastError;
      }

      const delayMs = calculateDelay(attempt, opts);
      opts.onRetry?.(lastError, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw new MaxRetriesExceededError(opts.maxAttempts, lastError);
}

export function isRetryableError(error: Error): boolean {
  const retryable = error as RetryableError;
  if (retryable.isRetryable === false) {
    return false;
  }
  if (retryable.isRetryable === true) {
    return true;
  }

  const retryableMessages = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'socket hang up',
    'connect ETIMEDOUT',
    'read ECONNRESET',
  ];

  return retryableMessages.some((msg) =>
    error.message.includes(msg) || (error as NodeJS.ErrnoException).code === msg,
  );
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;

  public constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: 5,
      successThreshold: 2,
      timeoutMs: 30000,
      monitorWindowMs: 60000,
      ...options,
    };
  }

  public getState(): CircuitBreakerState {
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null
      && Date.now() - this.lastFailureTime >= this.options.timeoutMs;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.options.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    this.state = newState;
    if (newState === 'OPEN') {
      this.options.onOpen?.();
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
      this.options.onClose?.();
    } else {
      this.successCount = 0;
      this.options.onHalfOpen?.();
    }
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  message?: string | undefined,
): Promise<T> {
  const timeoutError = new Error(message ?? `Operation timed out after ${timeoutMs}ms`);
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(timeoutError), timeoutMs),
  );
  return Promise.race([fn(), timeout]);
}

export async function withDeadline<T>(
  fn: () => Promise<T>,
  deadlineAt: Date,
): Promise<T> {
  const remainingMs = deadlineAt.getTime() - Date.now();
  if (remainingMs <= 0) {
    throw new Error('Deadline has already passed');
  }
  return withTimeout(fn, remainingMs);
}