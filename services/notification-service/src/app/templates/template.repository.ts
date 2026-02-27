import type { PrismaClient, Prisma } from '@prisma/client';
import { NotificationTemplate, TemplateFilter, TemplateListResponse, TemplateVersionRecord } from './template.types';
import { TemplateMapper } from './template.mapper';
import type { CreateTemplateDto, UpdateTemplateDto } from './template.schemas';

export class TemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreateTemplateDto, createdBy: string): Promise<NotificationTemplate> {
    const record = await this.prisma.notificationTemplate.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        channel: dto.channel,
        category: dto.category,
        status: 'DRAFT',
        subject: dto.subject,
        htmlBody: dto.htmlBody,
        textBody: dto.textBody,
        title: dto.title,
        variables: dto.variables as unknown as Prisma.InputJsonValue,
        metadata: dto.metadata as unknown as Prisma.InputJsonValue,
        version: 1,
        createdBy,
      },
    });

    await this.prisma.notificationTemplateVersion.create({
      data: {
        templateId: record.id,
        version: 1,
        subject: dto.subject,
        htmlBody: dto.htmlBody,
        textBody: dto.textBody,
        title: dto.title,
        variables: dto.variables as unknown as Prisma.InputJsonValue,
        createdBy,
      },
    });

    return TemplateMapper.toNotificationTemplate(record);
  }

  async update(id: string, dto: UpdateTemplateDto, updatedBy: string): Promise<NotificationTemplate> {
    const existing = await this.prisma.notificationTemplate.findUniqueOrThrow({ where: { id } });

    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.channel && { channel: dto.channel }),
        ...(dto.category && { category: dto.category }),
        ...(dto.status && { status: dto.status }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.htmlBody !== undefined && { htmlBody: dto.htmlBody }),
        ...(dto.textBody && { textBody: dto.textBody }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.variables && { variables: dto.variables as unknown as Prisma.InputJsonValue }),
        ...(dto.metadata && { metadata: dto.metadata as unknown as Prisma.InputJsonValue }),
        version: { increment: 1 },
        updatedBy,
      },
    });

    // Snapshot new version
    await this.prisma.notificationTemplateVersion.create({
      data: {
        templateId: id,
        version: existing.version + 1,
        subject: updated.subject,
        htmlBody: updated.htmlBody,
        textBody: updated.textBody,
        title: updated.title,
        variables: updated.variables as unknown as Prisma.InputJsonValue,
        createdBy: updatedBy,
      },
    });

    return TemplateMapper.toNotificationTemplate(updated);
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    const record = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    return record ? TemplateMapper.toNotificationTemplate(record) : null;
  }

  async findBySlugAndChannel(slug: string, channel: string): Promise<NotificationTemplate | null> {
    const record = await this.prisma.notificationTemplate.findFirst({
      where: { slug, channel, status: { not: 'ARCHIVED' } },
    });
    return record ? TemplateMapper.toNotificationTemplate(record) : null;
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const record = await this.prisma.notificationTemplate.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    return !!record;
  }

  async list(filter: TemplateFilter): Promise<TemplateListResponse> {
    const { page = 1, limit = 20, channel, category, status, search } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationTemplateWhereInput = {
      ...(channel && { channel }),
      ...(category && { category }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data: records.map(TemplateMapper.toNotificationTemplate),
      total,
      page,
      limit,
    };
  }

  async archive(id: string, updatedBy: string): Promise<NotificationTemplate> {
    const record = await this.prisma.notificationTemplate.update({
      where: { id },
      data: { status: 'ARCHIVED', updatedBy },
    });
    return TemplateMapper.toNotificationTemplate(record);
  }

  async restore(id: string, updatedBy: string): Promise<NotificationTemplate> {
    const record = await this.prisma.notificationTemplate.update({
      where: { id },
      data: { status: 'DRAFT', updatedBy },
    });
    return TemplateMapper.toNotificationTemplate(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.notificationTemplateVersion.deleteMany({ where: { templateId: id } }),
      this.prisma.notificationTemplate.delete({ where: { id } }),
    ]);
  }

  async listVersions(templateId: string): Promise<TemplateVersionRecord[]> {
    const records = await this.prisma.notificationTemplateVersion.findMany({
      where: { templateId },
      orderBy: { version: 'desc' },
    });
    return records.map(TemplateMapper.toTemplateVersionRecord);
  }

  async findVersion(templateId: string, version: number): Promise<TemplateVersionRecord | null> {
    const record = await this.prisma.notificationTemplateVersion.findFirst({
      where: { templateId, version },
    });
    return record ? TemplateMapper.toTemplateVersionRecord(record) : null;
  }
}