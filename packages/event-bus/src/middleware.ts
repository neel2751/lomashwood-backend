import { AnyEventPayload } from "./payload";

export type EventMiddlewareFn = (
  event: AnyEventPayload,
  next: () => Promise<void>
) => Promise<void>;

export interface EventMiddlewareContext {
  event: AnyEventPayload;
  topic: string;
  attempt: number;
  startedAt: Date;
}

export function loggingMiddleware(
  logger: { info: (msg: string, meta?: unknown) => void; error: (msg: string, meta?: unknown) => void }
): EventMiddlewareFn {
  return async (event, next) => {
    const start = Date.now();
    logger.info("Processing event", {
      eventId: event.eventId,
      topic: event.topic,
      source: event.source,
    });
    try {
      await next();
      logger.info("Event processed", {
        eventId: event.eventId,
        topic: event.topic,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      logger.error("Event processing failed", {
        eventId: event.eventId,
        topic: event.topic,
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };
}

export function validationMiddleware(): EventMiddlewareFn {
  return async (event, next) => {
    const e = event as AnyEventPayload & { data?: unknown };
    if (!e.eventId) throw new Error("Event missing eventId");
    if (!e.topic) throw new Error("Event missing topic");
    if (!e.timestamp) throw new Error("Event missing timestamp");
    if (!e.source) throw new Error("Event missing source");
    if (!e.data) throw new Error("Event missing data");
    await next();
  };
}

export function retryMiddleware(
  maxAttempts: number,
  delayMs: number
): EventMiddlewareFn {
  return async (_event, next) => {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        await next();
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) throw error;
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  };
}

export function deadLetterMiddleware(
  onDeadLetter: (event: AnyEventPayload, error: Error) => Promise<void>
): EventMiddlewareFn {
  return async (event, next) => {
    try {
      await next();
    } catch (error) {
      await onDeadLetter(event, error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export function composeMiddleware(middlewares: EventMiddlewareFn[]): EventMiddlewareFn {
  return async (event, next) => {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;

      const fn = i === middlewares.length ? next : middlewares[i];
      if (!fn) return;

      await fn(event, () => dispatch(i + 1));
    };

    await dispatch(0);
  };
}