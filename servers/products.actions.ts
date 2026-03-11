"use server";

import { Prisma, ProductFinish, ProductStyle } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema, parseBoolean } from "@servers/_shared";

const productCategorySchema = z.enum(["kitchen", "bedroom"]);
const productFinishSchema = z.enum(["gloss", "matt", "satin", "handleless", "shaker", "in-frame"]);
const productStyleSchema = z.enum(["contemporary", "traditional", "modern", "classic", "rustic"]);

const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: productCategorySchema,
  rangeName: z.string().min(1),
  images: z.array(z.string()).default([]),
  price: z.number().optional(),
  packageId: z.string().trim().min(1).optional(),
  styleId: z.string().trim().min(1).optional(),
  finishId: z.string().trim().min(1).optional(),
  finish: productFinishSchema.optional(),
  style: productStyleSchema.optional(),
  colourIds: z.array(z.string()).default([]),
  sizeIds: z.array(z.string()).default([]),
  isPublished: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  packageId: z.string().trim().min(1).nullable().optional(),
  styleId: z.string().trim().min(1).nullable().optional(),
  finishId: z.string().trim().min(1).nullable().optional(),
  finish: productFinishSchema.nullable().optional(),
  style: productStyleSchema.nullable().optional(),
});

const querySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  category: productCategorySchema.optional(),
  packageId: z.string().optional(),
  style: z.string().optional(),
  finish: z.string().optional(),
  styleId: z.string().optional(),
  finishId: z.string().optional(),
  isPublished: z.string().optional(),
});

const productInclude = {
  colours: { include: { colour: true } },
  sizes: { include: { size: true } },
  package: { select: { id: true, title: true, category: true, price: true, isActive: true } },
  styleRef: { select: { name: true } },
  finishRef: { select: { name: true } },
} satisfies Prisma.ProductInclude;

function normalizeFinish(value?: string) {
  return value?.replace("-", "_") as ProductFinish | undefined;
}

function normalizeStyle(value?: string) {
  return value as ProductStyle | undefined;
}

function normalizeLegacyStyleFilter(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  const enumValues: ProductStyle[] = ["contemporary", "traditional", "modern", "classic", "rustic"];
  return enumValues.includes(normalized as ProductStyle)
    ? (normalized as ProductStyle)
    : undefined;
}

async function resolveOptionReferences(input: {
  packageId?: string | null;
  styleId?: string | null;
  finishId?: string | null;
}) {
  const updates: { packageId?: string | null; styleId?: string | null; finishId?: string | null } = {};

  if (input.packageId !== undefined) {
    if (input.packageId === null) {
      updates.packageId = null;
    } else {
      const pkg = await prisma.package.findFirst({
        where: { id: input.packageId, isActive: true },
        select: { id: true },
      });
      if (!pkg) {
        throw new ActionError("Selected package is invalid or inactive", 400);
      }
      updates.packageId = pkg.id;
    }
  }

  if (input.styleId !== undefined) {
    if (input.styleId === null) {
      updates.styleId = null;
    } else {
      const style = await prisma.style.findFirst({
        where: { id: input.styleId, isActive: true },
        select: { id: true },
      });
      if (!style) {
        throw new ActionError("Selected style is invalid or inactive", 400);
      }
      updates.styleId = style.id;
    }
  }

  if (input.finishId !== undefined) {
    if (input.finishId === null) {
      updates.finishId = null;
    } else {
      const finish = await prisma.finish.findFirst({
        where: { id: input.finishId, isActive: true },
        select: { id: true },
      });
      if (!finish) {
        throw new ActionError("Selected finish is invalid or inactive", 400);
      }
      updates.finishId = finish.id;
    }
  }

  return updates;
}

function toProductDto(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
  const styleLabel = product.styleRef?.name ?? product.style ?? null;
  const finishLabel = product.finishRef?.name ?? product.finish?.replace("_", "-") ?? null;

  return {
    ...product,
    style: styleLabel,
    finish: finishLabel,
    packageTitle: product.package?.title ?? null,
    colours: product.colours.map((entry) => entry.colour),
    sizes: product.sizes.map((entry) => entry.size),
  };
}

export async function listProducts(rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const styleEnum = normalizeLegacyStyleFilter(query.style);
  const finishEnum = normalizeFinish(query.finish);
  const andFilters: Prisma.ProductWhereInput[] = [];

  const where: Prisma.ProductWhereInput = {
    category: query.category,
    packageId: query.packageId,
    styleId: query.styleId,
    finishId: query.finishId,
  };

  if (query.style) {
    andFilters.push({
      OR: [
        { styleRef: { name: { contains: query.style, mode: "insensitive" } } },
        ...(styleEnum ? [{ style: styleEnum }] : []),
      ],
    });
  }

  if (query.finish) {
    andFilters.push({
      OR: [
        { finishRef: { name: { contains: query.finish, mode: "insensitive" } } },
        ...(finishEnum ? [{ finish: finishEnum }] : []),
      ],
    });
  }

  const published = parseBoolean(query.isPublished);
  if (published !== undefined) {
    where.isPublished = published;
  }

  if (query.search) {
    andFilters.push({
      OR: [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { rangeName: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: items.map(toProductDto),
    ...calculatePagination(total, page, limit),
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) {
    throw new ActionError("Product not found", 404);
  }
  return toProductDto(product);
}

export async function createProduct(payload: unknown) {
  const data = createProductSchema.parse(payload);
  const optionRefs = await resolveOptionReferences({
    packageId: data.packageId,
    styleId: data.styleId,
    finishId: data.finishId,
  });

  const product = await prisma.product.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      rangeName: data.rangeName,
      images: data.images,
      price: data.price,
      ...optionRefs,
      finish: normalizeFinish(data.finish),
      style: normalizeStyle(data.style),
      isPublished: data.isPublished ?? false,
      colours: {
        createMany: {
          data: data.colourIds.map((colourId) => ({ colourId })),
          skipDuplicates: true,
        },
      },
      sizes: {
        createMany: {
          data: data.sizeIds.map((sizeId) => ({ sizeId })),
          skipDuplicates: true,
        },
      },
    },
    include: productInclude,
  });

  return toProductDto(product);
}

export async function updateProduct(id: string, payload: unknown) {
  const data = updateProductSchema.parse(payload);
  const optionRefs = await resolveOptionReferences({
    packageId: data.packageId,
    styleId: data.styleId,
    finishId: data.finishId,
  });

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Product not found", 404);
  }

  const product = await prisma.$transaction(async (tx) => {
    if (data.colourIds) {
      await tx.productColour.deleteMany({ where: { productId: id } });
      if (data.colourIds.length > 0) {
        await tx.productColour.createMany({
          data: data.colourIds.map((colourId) => ({ productId: id, colourId })),
          skipDuplicates: true,
        });
      }
    }

    if (data.sizeIds) {
      await tx.productSize.deleteMany({ where: { productId: id } });
      if (data.sizeIds.length > 0) {
        await tx.productSize.createMany({
          data: data.sizeIds.map((sizeId) => ({ productId: id, sizeId })),
          skipDuplicates: true,
        });
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        rangeName: data.rangeName,
        images: data.images,
        price: data.price,
        ...optionRefs,
        finish: data.finish === null ? null : normalizeFinish(data.finish),
        style: data.style === null ? null : normalizeStyle(data.style),
        isPublished: data.isPublished,
      },
      include: productInclude,
    });
  });

  return toProductDto(product);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  return { message: "Product deleted" };
}
