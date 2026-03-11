"use server";

import { Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema, parseBoolean } from "@servers/_shared";

const productCategorySchema = z.enum(["kitchen", "bedroom"]);

const packageSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  image: z.string().trim().url().optional(),
  category: productCategorySchema,
  price: z.number().nonnegative().optional(),
  features: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().optional(),
});

const packageUpdateSchema = packageSchema.partial();

const packageQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  category: productCategorySchema.optional(),
  isActive: z.string().optional(),
});

const packageInclude = {
  products: {
    select: {
      id: true,
      title: true,
      category: true,
      price: true,
      isPublished: true,
    },
    orderBy: { title: "asc" },
  },
  _count: {
    select: { products: true },
  },
} satisfies Prisma.PackageInclude;

function normalizePackageUpdateInput(data: z.infer<typeof packageUpdateSchema>): Prisma.PackageUpdateInput {
  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    description: data.description === undefined ? undefined : data.description || null,
    image: data.image === undefined ? undefined : data.image || null,
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.price !== undefined ? { price: data.price } : {}),
    ...(data.features !== undefined ? { features: data.features } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
  };
}

function toPackageDto(item: Prisma.PackageGetPayload<{ include: typeof packageInclude }>) {
  return {
    ...item,
    productsCount: item._count.products,
  };
}

export async function listPackages(rawQuery: Record<string, unknown>) {
  const query = packageQuerySchema.parse(rawQuery);
  const { page, limit, search, category } = query;
  const isActive = parseBoolean(query.isActive);
  const skip = (page - 1) * limit;

  const where: Prisma.PackageWhereInput = {
    category,
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { features: { hasSome: [search] } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.package.count({ where }),
    prisma.package.findMany({
      where,
      include: packageInclude,
      orderBy: [{ isActive: "desc" }, { title: "asc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data: data.map(toPackageDto),
    ...calculatePagination(total, page, limit),
  };
}

export async function getPackageById(id: string) {
  const item = await prisma.package.findUnique({ where: { id }, include: packageInclude });
  if (!item) {
    throw new ActionError("Package not found", 404);
  }

  return toPackageDto(item);
}

export async function createPackage(payload: unknown) {
  const data = packageSchema.parse(payload);

  const existing = await prisma.package.findFirst({
    where: { title: { equals: data.title, mode: "insensitive" } },
    select: { id: true },
  });

  if (existing) {
    throw new ActionError("Package title already exists", 409);
  }

  const item = await prisma.package.create({
    data: {
      title: data.title,
      description: data.description || null,
      image: data.image || null,
      category: data.category,
      price: data.price,
      features: data.features,
      isActive: data.isActive ?? true,
    },
    include: packageInclude,
  });

  return toPackageDto(item);
}

export async function updatePackage(id: string, payload: unknown) {
  const data = packageUpdateSchema.parse(payload);

  const existing = await prisma.package.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Package not found", 404);
  }

  if (data.title) {
    const duplicate = await prisma.package.findFirst({
      where: {
        id: { not: id },
        title: { equals: data.title, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ActionError("Package title already exists", 409);
    }
  }

  const item = await prisma.package.update({
    where: { id },
    data: normalizePackageUpdateInput(data),
    include: packageInclude,
  });

  return toPackageDto(item);
}

export async function deletePackage(id: string) {
  const existing = await prisma.package.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Package not found", 404);
  }

  await prisma.package.delete({ where: { id } });
  return { message: "Package deleted" };
}