"use server";

import { Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema, parseBoolean, parseDate } from "@servers/_shared";

const loyaltyTierSchema = z.enum(["bronze", "silver", "gold", "platinum"]);

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  postcode: z.string().min(1),
  address: z.string().default(""),
  loyaltyPoints: z.number().int().nonnegative().optional(),
  loyaltyTier: loyaltyTierSchema.optional(),
  totalSpend: z.number().nonnegative().optional(),
  orderCount: z.number().int().nonnegative().optional(),
  appointmentCount: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

const querySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  loyaltyTier: loyaltyTierSchema.optional(),
  isActive: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function listCustomers(rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {
    loyaltyTier: query.loyaltyTier,
  };

  const active = parseBoolean(query.isActive);
  if (active !== undefined) {
    where.isActive = active;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
      { postcode: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const startDate = parseDate(query.startDate);
  const endDate = parseDate(query.endDate);
  if (startDate || endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const [total, data] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
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

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new ActionError("Customer not found", 404);
  }
  return customer;
}

export async function createCustomer(payload: unknown) {
  const data = createCustomerSchema.parse(payload);

  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      postcode: data.postcode,
      address: data.address,
      loyaltyPoints: data.loyaltyPoints,
      loyaltyTier: data.loyaltyTier,
      totalSpend: data.totalSpend,
      orderCount: data.orderCount,
      appointmentCount: data.appointmentCount,
      isActive: data.isActive,
    },
  });
}

export async function updateCustomer(id: string, payload: unknown) {
  const data = updateCustomerSchema.parse(payload);

  const existing = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Customer not found", 404);
  }

  return prisma.customer.update({ where: { id }, data });
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  return { message: "Customer deleted" };
}
