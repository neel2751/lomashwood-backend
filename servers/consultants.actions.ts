"use server";

import { Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema } from "@servers/_shared";

const createConsultantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  speciality: z.array(z.string()).optional().default([]),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  availability: z.string().optional(),
  notes: z.string().optional(),
});

const updateConsultantSchema = createConsultantSchema.partial();

const querySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  speciality: z.string().optional(),
});

function whereFromQuery(query: z.infer<typeof querySchema>): Prisma.ConsultantWhereInput {
  const where: Prisma.ConsultantWhereInput = {};

  if (query.status) where.status = query.status;

  if (query.speciality) {
    where.speciality = { has: query.speciality };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listConsultants(rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where = whereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.consultant.count({ where }),
    prisma.consultant.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
  ]);

  return { data, ...calculatePagination(total, page, limit) };
}

export async function getConsultantById(id: string) {
  const consultant = await prisma.consultant.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { slot: "desc" },
        take: 10,
        select: { id: true, slot: true, status: true, customerName: true, type: true },
      },
    },
  });

  if (!consultant) {
    throw new ActionError("Consultant not found", 404);
  }

  return consultant;
}

export async function createConsultant(body: unknown) {
  const data = createConsultantSchema.parse(body);

  const existing = await prisma.consultant.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ActionError("A consultant with this email already exists", 409);
  }

  return prisma.consultant.create({ data });
}

export async function updateConsultant(id: string, body: unknown) {
  const data = updateConsultantSchema.parse(body);

  const consultant = await prisma.consultant.findUnique({ where: { id } });
  if (!consultant) {
    throw new ActionError("Consultant not found", 404);
  }

  if (data.email && data.email !== consultant.email) {
    const existing = await prisma.consultant.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ActionError("A consultant with this email already exists", 409);
    }
  }

  return prisma.consultant.update({ where: { id }, data });
}

export async function deleteConsultant(id: string) {
  const consultant = await prisma.consultant.findUnique({ where: { id } });
  if (!consultant) {
    throw new ActionError("Consultant not found", 404);
  }

  return prisma.consultant.delete({ where: { id } });
}
