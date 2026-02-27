import { PrismaClient } from '@prisma/client';
import { prisma } from '../../infrastructure/db/prisma.client';

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface BannerRecord {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  imageKey: string;
  mobileImageUrl: string | null;
  mobileImageKey: string | null;
  altText: string | null;
  linkUrl: string | null;
  linkText: string | null;
  placement: string;
  status: ContentStatus;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateBannerPayload {
  title: string;
  description?: string;
  imageUrl: string;
  imageKey: string;
  mobileImageUrl?: string;
  mobileImageKey?: string;
  altText?: string;
  linkUrl?: string;
  linkText?: string;
  placement: string;
  status?: ContentStatus;
  sortOrder?: number;
  startsAt?: Date;
  endsAt?: Date;
}

export type UpdateBannerPayload = Partial<CreateBannerPayload>;

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

export class BannerRepository {
  private readonly db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? prisma;
  }

  async findAll(): Promise<BannerRecord[]> {
    return (this.db as any).banner.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActive(): Promise<BannerRecord[]> {
    const now = new Date();
    return (this.db as any).banner.findMany({
      where: {
        deletedAt: null,
        status: ContentStatus.PUBLISHED,
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: now }, endsAt: null },
          { startsAt: null, endsAt: { gte: now } },
          { startsAt: { lte: now }, endsAt: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByPlacement(placement: string): Promise<BannerRecord[]> {
    return (this.db as any).banner.findMany({
      where: { placement, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<BannerRecord | null> {
    return (this.db as any).banner.findUnique({
      where: { id },
    });
  }

  async create(payload: CreateBannerPayload): Promise<BannerRecord> {
    return (this.db as any).banner.create({
      data: {
        title: payload.title,
        description: payload.description ?? null,
        imageUrl: payload.imageUrl,
        imageKey: payload.imageKey,
        mobileImageUrl: payload.mobileImageUrl ?? null,
        mobileImageKey: payload.mobileImageKey ?? null,
        altText: payload.altText ?? null,
        linkUrl: payload.linkUrl ?? null,
        linkText: payload.linkText ?? null,
        placement: payload.placement,
        status: payload.status ?? ContentStatus.DRAFT,
        sortOrder: payload.sortOrder ?? 0,
        startsAt: payload.startsAt ?? null,
        endsAt: payload.endsAt ?? null,
      },
    });
  }

  async update(id: string, payload: UpdateBannerPayload): Promise<BannerRecord> {
    return (this.db as any).banner.update({
      where: { id },
      data: {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.imageUrl !== undefined && { imageUrl: payload.imageUrl }),
        ...(payload.imageKey !== undefined && { imageKey: payload.imageKey }),
        ...(payload.mobileImageUrl !== undefined && { mobileImageUrl: payload.mobileImageUrl }),
        ...(payload.mobileImageKey !== undefined && { mobileImageKey: payload.mobileImageKey }),
        ...(payload.altText !== undefined && { altText: payload.altText }),
        ...(payload.linkUrl !== undefined && { linkUrl: payload.linkUrl }),
        ...(payload.linkText !== undefined && { linkText: payload.linkText }),
        ...(payload.placement !== undefined && { placement: payload.placement }),
        ...(payload.status !== undefined && { status: payload.status }),
        ...(payload.sortOrder !== undefined && { sortOrder: payload.sortOrder }),
        ...(payload.startsAt !== undefined && { startsAt: payload.startsAt }),
        ...(payload.endsAt !== undefined && { endsAt: payload.endsAt }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await (this.db as any).banner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reorder(items: ReorderItem[]): Promise<void> {
    await this.db.$transaction(
      items.map(({ id, sortOrder }) =>
        (this.db as any).banner.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );
  }
}