"use server";

import { Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema, parseBoolean } from "@servers/_shared";

const optionSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  image: z.string().trim().url().optional(),
  isActive: z.boolean().optional(),
});

const optionQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  isActive: z.string().optional(),
});

const optionUpdateSchema = optionSchema.partial();

type OptionType = "style" | "finish";

function normalizeOptionInput(data: z.infer<typeof optionSchema>) {
  return {
    name: data.name,
    description: data.description || null,
    image: data.image || null,
    isActive: data.isActive ?? true,
  };
}

function buildWhere(query: z.infer<typeof optionQuerySchema>) {
  const where: {
    isActive?: boolean;
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      description?: { contains: string; mode: "insensitive" };
    }>;
  } = {};
  const isActive = parseBoolean(query.isActive);

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function notFoundError(type: OptionType) {
  return new ActionError(`${type === "style" ? "Style" : "Finish"} not found`, 404);
}

export async function listProductOptions(type: OptionType, rawQuery: Record<string, unknown>) {
  const query = optionQuerySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = buildWhere(query);

  const [total, data] =
    type === "style"
      ? await Promise.all([
          prisma.style.count({ where: where as Prisma.StyleWhereInput }),
          prisma.style.findMany({
            where: where as Prisma.StyleWhereInput,
            orderBy: [{ isActive: "desc" }, { name: "asc" }],
            skip,
            take: limit,
          }),
        ])
      : await Promise.all([
          prisma.finish.count({ where: where as Prisma.FinishWhereInput }),
          prisma.finish.findMany({
            where: where as Prisma.FinishWhereInput,
            orderBy: [{ isActive: "desc" }, { name: "asc" }],
            skip,
            take: limit,
          }),
        ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function getProductOptionById(type: OptionType, id: string) {
  const item =
    type === "style"
      ? await prisma.style.findUnique({ where: { id } })
      : await prisma.finish.findUnique({ where: { id } });

  if (!item) {
    throw notFoundError(type);
  }

  return item;
}

export async function createProductOption(type: OptionType, payload: unknown) {
  const parsed = optionSchema.parse(payload);
  const existing =
    type === "style"
      ? await prisma.style.findFirst({
          where: { name: { equals: parsed.name, mode: "insensitive" } },
          select: { id: true },
        })
      : await prisma.finish.findFirst({
          where: { name: { equals: parsed.name, mode: "insensitive" } },
          select: { id: true },
        });

  if (existing) {
    throw new ActionError(`${type === "style" ? "Style" : "Finish"} name already exists`, 409);
  }

  return type === "style"
    ? prisma.style.create({ data: normalizeOptionInput(parsed) })
    : prisma.finish.create({ data: normalizeOptionInput(parsed) });
}

export async function updateProductOption(type: OptionType, id: string, payload: unknown) {
  const parsed = optionUpdateSchema.parse(payload);
  const existing =
    type === "style"
      ? await prisma.style.findUnique({ where: { id }, select: { id: true } })
      : await prisma.finish.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw notFoundError(type);
  }

  if (parsed.name) {
    const duplicate =
      type === "style"
        ? await prisma.style.findFirst({
            where: {
              id: { not: id },
              name: { equals: parsed.name, mode: "insensitive" },
            },
            select: { id: true },
          })
        : await prisma.finish.findFirst({
            where: {
              id: { not: id },
              name: { equals: parsed.name, mode: "insensitive" },
            },
            select: { id: true },
          });

    if (duplicate) {
      throw new ActionError(`${type === "style" ? "Style" : "Finish"} name already exists`, 409);
    }
  }

  const updateData = {
    name: parsed.name,
    description: parsed.description === undefined ? undefined : parsed.description || null,
    image: parsed.image === undefined ? undefined : parsed.image || null,
    isActive: parsed.isActive,
  };

  return type === "style"
    ? prisma.style.update({ where: { id }, data: updateData })
    : prisma.finish.update({ where: { id }, data: updateData });
}

export async function deleteProductOption(type: OptionType, id: string) {
  const existing =
    type === "style"
      ? await prisma.style.findUnique({ where: { id }, select: { id: true } })
      : await prisma.finish.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    throw notFoundError(type);
  }

  if (type === "style") {
    await prisma.style.delete({ where: { id } });
  } else {
    await prisma.finish.delete({ where: { id } });
  }
  return { message: `${type === "style" ? "Style" : "Finish"} deleted` };
}
