"use server";

import { Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema, parseDate } from "@servers/_shared";

const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productTitle: z.string().optional(),
  productImage: z.string().optional(),
  productCategory: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  options: z.record(z.string()).optional(),
});

const createOrderSchema = z.object({
  orderNumber: z.string().min(1),
  customerId: z.string().min(1),
  status: orderStatusSchema.optional(),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  shippingAddress: z.record(z.any()).optional(),
  billingAddress: z.record(z.any()).optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  notes: z.string().optional(),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  shippingAddress: z.record(z.any()).optional(),
  billingAddress: z.record(z.any()).optional(),
});

const querySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: orderStatusSchema.optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const orderInclude = {
  customer: true,
  items: true,
} satisfies Prisma.OrderInclude;

function toOrderDto(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  return {
    ...order,
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone,
  };
}

export async function listOrders(rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    status: query.status,
    customerId: query.customerId,
  };

  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
      { customer: { email: { contains: query.search, mode: "insensitive" } } },
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

  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: items.map(toOrderDto),
    ...calculatePagination(total, page, limit),
  };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) {
    throw new ActionError("Order not found", 404);
  }
  return toOrderDto(order);
}

export async function createOrder(payload: unknown) {
  const data = createOrderSchema.parse(payload);

  const customer = await prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } });
  if (!customer) {
    throw new ActionError("Customer not found", 404);
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: data.orderNumber,
        customerId: data.customerId,
        status: data.status,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        notes: data.notes,
        items: {
          create: data.items,
        },
      },
      include: orderInclude,
    });

    await tx.customer.update({
      where: { id: data.customerId },
      data: {
        totalSpend: { increment: data.total },
        orderCount: { increment: 1 },
      },
    });

    return created;
  });

  return toOrderDto(order);
}

export async function updateOrder(id: string, payload: unknown) {
  const data = updateOrderSchema.parse(payload);

  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Order not found", 404);
  }

  const order = await prisma.order.update({
    where: { id },
    data,
    include: orderInclude,
  });

  return toOrderDto(order);
}

export async function deleteOrder(id: string) {
  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true, customerId: true, total: true } });
  if (!existing) {
    throw new ActionError("Order not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.delete({ where: { id } });
    await tx.customer.update({
      where: { id: existing.customerId },
      data: {
        totalSpend: { decrement: existing.total },
        orderCount: { decrement: 1 },
      },
    });
  });

  return { message: "Order deleted" };
}
