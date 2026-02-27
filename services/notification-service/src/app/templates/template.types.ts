export enum TemplateChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum TemplateCategory {
  TRANSACTIONAL = 'TRANSACTIONAL',
  MARKETING = 'MARKETING',
  SYSTEM = 'SYSTEM',
}

export interface TemplateVariable {
  key: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  slug: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  status: TemplateStatus;
  subject?: string;           // email only
  htmlBody?: string;          // email only
  textBody: string;           // email (plain-text fallback), SMS, push body
  title?: string;             // push only
  variables: TemplateVariable[];
  metadata?: Record<string, unknown>;
  version: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateRequest {
  name: string;
  slug: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject?: string;
  htmlBody?: string;
  textBody: string;
  title?: string;
  variables?: TemplateVariable[];
  metadata?: Record<string, unknown>;
}

export interface UpdateTemplateRequest {
  name?: string;
  channel?: TemplateChannel;
  category?: TemplateCategory;
  status?: TemplateStatus;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  title?: string;
  variables?: TemplateVariable[];
  metadata?: Record<string, unknown>;
}

export interface RenderTemplateRequest {
  slug: string;
  channel: TemplateChannel;
  variables: Record<string, string>;
}

export interface RenderTemplateResponse {
  subject?: string;
  htmlBody?: string;
  textBody: string;
  title?: string;
}

export interface TemplateFilter {
  channel?: TemplateChannel;
  category?: TemplateCategory;
  status?: TemplateStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TemplateListResponse {
  data: NotificationTemplate[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateVersionRecord {
  id: string;
  templateId: string;
  version: number;
  subject?: string;
  htmlBody?: string;
  textBody: string;
  title?: string;
  variables: TemplateVariable[];
  createdBy: string;
  createdAt: Date;
}