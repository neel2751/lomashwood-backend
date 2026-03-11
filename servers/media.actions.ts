"use server";

import { Prisma, MediaStatus } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema } from "@servers/_shared";

const mediaCreateSchema = z.object({
  key: z.string().trim().min(1),
  url: z.string().trim().url(),
  fileName: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  folder: z.string().trim().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  source: z.string().trim().optional(),
  status: z.nativeEnum(MediaStatus).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const mediaUpdateSchema = mediaCreateSchema.partial().omit({ key: true, url: true });

const mediaQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: z.nativeEnum(MediaStatus).optional(),
});

function mediaWhereFromQuery(query: z.infer<typeof mediaQuerySchema>): Prisma.MediaWhereInput {
  const where: Prisma.MediaWhereInput = {
    deletedAt: null,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { key: { contains: query.search, mode: "insensitive" } },
      { fileName: { contains: query.search, mode: "insensitive" } },
      { url: { contains: query.search, mode: "insensitive" } },
      { folder: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function toJsonMetadata(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

export async function listMediaAssets(rawQuery: Record<string, unknown>) {
  const query = mediaQuerySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = mediaWhereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function getMediaAssetById(id: string) {
  const media = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!media) {
    throw new ActionError("Media not found", 404);
  }
  return media;
}

export async function createMediaAsset(payload: unknown) {
  const data = mediaCreateSchema.parse(payload);
  const metadata = toJsonMetadata(data.metadata);

  return prisma.media.upsert({
    where: { key: data.key },
    update: {
      fileName: data.fileName,
      mimeType: data.mimeType,
      folder: data.folder,
      sizeBytes: data.sizeBytes,
      source: data.source,
      status: data.status ?? MediaStatus.untouched,
      metadata,
      deletedAt: null,
    },
    create: {
      key: data.key,
      url: data.url,
      fileName: data.fileName,
      mimeType: data.mimeType,
      folder: data.folder,
      sizeBytes: data.sizeBytes,
      source: data.source,
      status: data.status ?? MediaStatus.untouched,
      metadata,
    },
  });
}

export async function updateMediaAsset(id: string, payload: unknown) {
  const data = mediaUpdateSchema.parse(payload);
  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw new ActionError("Media not found", 404);
  }

  const updateData: Prisma.MediaUpdateInput = {
    fileName: data.fileName,
    mimeType: data.mimeType,
    folder: data.folder,
    sizeBytes: data.sizeBytes,
    source: data.source,
    status: data.status,
    metadata: toJsonMetadata(data.metadata),
  };

  return prisma.media.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteMediaAsset(id: string) {
  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw new ActionError("Media not found", 404);
  }

  await prisma.media.update({
    where: { id },
    data: {
      status: MediaStatus.deleted,
      deletedAt: new Date(),
    },
  });

  return { message: "Media marked as deleted" };
}
