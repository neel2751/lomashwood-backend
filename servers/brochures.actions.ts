"use server";

import { BrochureDeliveryMethod, Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import {
  ActionError,
  calculatePagination,
  paginationQuerySchema,
  parseBoolean,
} from "@servers/_shared";

const brochureCreateSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().optional(),
  coverImage: z.string().trim().url().optional(),
  pdfUrl: z.string().trim().url(),
  category: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  pages: z.number().int().positive().optional(),
  sizeMb: z.number().positive().optional(),
  year: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const brochureUpdateSchema = brochureCreateSchema.partial();

const brochureQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  featured: z.string().optional(),
  isPublished: z.string().optional(),
});

const brochureRequestCreateSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  address: z.string().trim().min(1),
  deliveryMethod: z.nativeEnum(BrochureDeliveryMethod),
  marketingOptIn: z.boolean().optional(),
  brochureIds: z.array(z.string().trim().min(1)).default([]),
  notes: z.string().trim().optional(),
});

const brochureRequestQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  deliveryMethod: z.nativeEnum(BrochureDeliveryMethod).optional(),
});

function brochureWhereFromQuery(
  query: z.infer<typeof brochureQuerySchema>,
): Prisma.BrochureWhereInput {
  const where: Prisma.BrochureWhereInput = {
    category: query.category,
  };

  const featured = parseBoolean(query.featured);
  if (featured !== undefined) {
    where.isFeatured = featured;
  }

  const isPublished = parseBoolean(query.isPublished);
  if (isPublished !== undefined) {
    where.isPublished = isPublished;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { category: { contains: query.search, mode: "insensitive" } },
      { tags: { has: query.search } },
    ];
  }

  return where;
}

function brochureRequestWhereFromQuery(
  query: z.infer<typeof brochureRequestQuerySchema>,
): Prisma.BrochureRequestWhereInput {
  const where: Prisma.BrochureRequestWhereInput = {
    deliveryMethod: query.deliveryMethod,
  };

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
      { postcode: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listBrochures(rawQuery: Record<string, unknown>) {
  const query = brochureQuerySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = brochureWhereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.brochure.count({ where }),
    prisma.brochure.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function getBrochureById(id: string) {
  const brochure = await prisma.brochure.findUnique({ where: { id } });
  if (!brochure) {
    throw new ActionError("Brochure not found", 404);
  }
  return brochure;
}

export async function getPublicBrochureData(rawQuery: Record<string, unknown>) {
  const list = await listBrochures({ ...rawQuery, isPublished: "true" });

  return {
    ...list,
    featured: list.data.filter((item) => item.isFeatured),
  };
}

export async function createBrochure(payload: unknown) {
  const data = brochureCreateSchema.parse(payload);

  const existing = await prisma.brochure.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new ActionError("Brochure slug already exists", 409);
  }

  return prisma.brochure.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      coverImage: data.coverImage,
      pdfUrl: data.pdfUrl,
      category: data.category,
      tags: data.tags,
      pages: data.pages,
      sizeMb: data.sizeMb,
      year: data.year,
      isFeatured: data.isFeatured ?? false,
      isPublished: data.isPublished ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateBrochure(id: string, payload: unknown) {
  const data = brochureUpdateSchema.parse(payload);
  const existing = await prisma.brochure.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    throw new ActionError("Brochure not found", 404);
  }

  if (data.slug) {
    const duplicate = await prisma.brochure.findFirst({
      where: { id: { not: id }, slug: data.slug },
      select: { id: true },
    });

    if (duplicate) {
      throw new ActionError("Brochure slug already exists", 409);
    }
  }

  return prisma.brochure.update({ where: { id }, data });
}

export async function deleteBrochure(id: string) {
  const existing = await prisma.brochure.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Brochure not found", 404);
  }

  await prisma.brochure.delete({ where: { id } });
  return { message: "Brochure deleted" };
}

export async function incrementBrochureDownload(id: string) {
  const existing = await prisma.brochure.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Brochure not found", 404);
  }

  return prisma.brochure.update({
    where: { id },
    data: { downloads: { increment: 1 } },
  });
}

export async function listBrochureRequests(rawQuery: Record<string, unknown>) {
  const query = brochureRequestQuerySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = brochureRequestWhereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.brochureRequest.count({ where }),
    prisma.brochureRequest.findMany({
      where,
      include: {
        brochures: {
          select: { id: true, title: true, slug: true, coverImage: true, pdfUrl: true },
        },
      },
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

export async function getBrochureRequestById(id: string) {
  const request = await prisma.brochureRequest.findUnique({
    where: { id },
    include: {
      brochures: {
        select: { id: true, title: true, slug: true, coverImage: true, pdfUrl: true },
      },
    },
  });

  if (!request) {
    throw new ActionError("Brochure request not found", 404);
  }

  return request;
}

export async function createBrochureRequest(payload: unknown) {
  const data = brochureRequestCreateSchema.parse(payload);

  const brochures =
    data.brochureIds.length > 0
      ? await prisma.brochure.findMany({
          where: { id: { in: data.brochureIds }, isPublished: true },
          select: { id: true, title: true },
        })
      : [];

  if (data.brochureIds.length > 0 && brochures.length === 0) {
    throw new ActionError("No valid brochures selected", 400);
  }

  return prisma.brochureRequest.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      postcode: data.postcode,
      address: data.address,
      deliveryMethod: data.deliveryMethod,
      marketingOptIn: data.marketingOptIn ?? false,
      brochureIds: brochures.map((item) => item.id),
      brochureTitles: brochures.map((item) => item.title),
      notes: data.notes,
      brochures:
        brochures.length > 0
          ? {
              connect: brochures.map((item) => ({ id: item.id })),
            }
          : undefined,
    },
    include: {
      brochures: {
        select: { id: true, title: true, slug: true, coverImage: true, pdfUrl: true },
      },
    },
  });
}
