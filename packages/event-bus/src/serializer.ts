import { v4 as uuidv4 } from "uuid";
import { AnyEventPayload, BaseEventPayload } from "./payload";
import { EventTopic } from "./topics";

export interface SerializedEvent {
  raw: string;
  parsed: AnyEventPayload;
}

export function serializeEvent(payload: AnyEventPayload): string {
  return JSON.stringify(payload);
}

export function deserializeEvent(raw: string): AnyEventPayload {
  const parsed = JSON.parse(raw) as AnyEventPayload;

  if (!parsed["eventId"] || !parsed["topic"] || !parsed["timestamp"] || !parsed["source"]) {
    throw new Error("Invalid event payload: missing required fields");
  }

  return parsed;
}

export function createEventPayload<T extends Record<string, unknown>>(
  topic: EventTopic,
  source: string,
  data: T,
  options: {
    version?: string;
    correlationId?: string;
    causationId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): BaseEventPayload & { topic: EventTopic; data: T } {
  const payload: BaseEventPayload & { topic: EventTopic; data: T } = {
    eventId: uuidv4(),
    topic,
    version: options.version ?? "1.0.0",
    timestamp: new Date().toISOString(),
    source,
    data,
  };

  if (options.correlationId !== undefined) payload.correlationId = options.correlationId;
  if (options.causationId !== undefined) payload.causationId = options.causationId;
  if (options.metadata !== undefined) payload.metadata = options.metadata;

  return payload;
}

export function isValidEvent(payload: unknown): payload is AnyEventPayload {
  if (typeof payload !== "object" || payload === null) return false;

  const event = payload as Record<string, unknown>;

  return (
    typeof event["eventId"] === "string" &&
    typeof event["topic"] === "string" &&
    typeof event["version"] === "string" &&
    typeof event["timestamp"] === "string" &&
    typeof event["source"] === "string" &&
    typeof event["data"] === "object" &&
    event["data"] !== null
  );
}