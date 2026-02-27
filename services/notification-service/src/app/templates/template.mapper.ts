import {
  NotificationTemplate,
  TemplateChannel,
  TemplateCategory,
  TemplateStatus,
  TemplateVariable,
  TemplateVersionRecord,
  RenderTemplateResponse,
} from './template.types';
import { TEMPLATE_CONSTANTS } from './template.constants';

type RawTemplate = {
  id: string;
  name: string;
  slug: string;
  channel: string;
  category: string;
  status: string;
  subject?: string | null;
  htmlBody?: string | null;
  textBody: string;
  title?: string | null;
  variables: unknown;
  metadata?: unknown | null;
  version: number;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RawTemplateVersion = {
  id: string;
  templateId: string;
  version: number;
  subject?: string | null;
  htmlBody?: string | null;
  textBody: string;
  title?: string | null;
  variables: unknown;
  createdBy: string;
  createdAt: Date;
};

export class TemplateMapper {
  static toNotificationTemplate(raw: RawTemplate): NotificationTemplate {
    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      channel: raw.channel as TemplateChannel,
      category: raw.category as TemplateCategory,
      status: raw.status as TemplateStatus,
      subject: raw.subject ?? undefined,
      htmlBody: raw.htmlBody ?? undefined,
      textBody: raw.textBody,
      title: raw.title ?? undefined,
      variables: TemplateMapper.parseVariables(raw.variables),
      metadata: (raw.metadata as Record<string, unknown>) ?? undefined,
      version: raw.version,
      createdBy: raw.createdBy,
      updatedBy: raw.updatedBy ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static toTemplateVersionRecord(raw: RawTemplateVersion): TemplateVersionRecord {
    return {
      id: raw.id,
      templateId: raw.templateId,
      version: raw.version,
      subject: raw.subject ?? undefined,
      htmlBody: raw.htmlBody ?? undefined,
      textBody: raw.textBody,
      title: raw.title ?? undefined,
      variables: TemplateMapper.parseVariables(raw.variables),
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
    };
  }

  static parseVariables(raw: unknown): TemplateVariable[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as TemplateVariable[];
    try {
      return JSON.parse(raw as string) as TemplateVariable[];
    } catch {
      return [];
    }
  }

  static extractVariableKeys(template: string): string[] {
    const regex = new RegExp(TEMPLATE_CONSTANTS.VARIABLE_REGEX.source, 'g');
    const keys = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(template)) !== null) {
      keys.add(match[1]);
    }
    return Array.from(keys);
  }

  static renderTemplate(
    template: string,
    variables: Record<string, string>,
    defined: TemplateVariable[],
  ): string {
    return template.replace(TEMPLATE_CONSTANTS.VARIABLE_REGEX, (_match, key: string) => {
      if (key in variables) return variables[key];
      const def = defined.find((v) => v.key === key);
      if (def?.defaultValue !== undefined) return def.defaultValue;
      return `{{${key}}}`;
    });
  }

  static toRenderedResponse(
    template: NotificationTemplate,
    variables: Record<string, string>,
  ): RenderTemplateResponse {
    const rendered: RenderTemplateResponse = {
      textBody: TemplateMapper.renderTemplate(template.textBody, variables, template.variables),
    };

    if (template.subject) {
      rendered.subject = TemplateMapper.renderTemplate(template.subject, variables, template.variables);
    }

    if (template.htmlBody) {
      rendered.htmlBody = TemplateMapper.renderTemplate(template.htmlBody, variables, template.variables);
    }

    if (template.title) {
      rendered.title = TemplateMapper.renderTemplate(template.title, variables, template.variables);
    }

    return rendered;
  }
}