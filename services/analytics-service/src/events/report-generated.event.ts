import { publishEvent } from '../infrastructure/messaging/event-consumer';
import { ANALYTICS_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export interface ReportGeneratedPayload {
  reportId: string;
  name: string;
  type: string;
  requestedBy: string;
  rowCount?: number;
  generatedAt: string;
}

export async function emitReportGenerated(
  payload: ReportGeneratedPayload,
  meta?: { correlationId?: string; userId?: string },
): Promise<void> {
  await publishEvent(
    ANALYTICS_EVENT_TOPICS.PUBLISH.REPORT_GENERATED,
    payload,
    meta,
  );
}

export function buildReportGeneratedPayload(
  reportId: string,
  name: string,
  type: string,
  requestedBy: string,
  options?: { rowCount?: number },
): ReportGeneratedPayload {
  return {
    reportId,
    name,
    type,
    requestedBy,
    rowCount: options?.rowCount,
    generatedAt: new Date().toISOString(),
  };
}