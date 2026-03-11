"use server";

import prisma from "@/lib/prisma";

export async function getAnalyticsOverview() {
  const [totalRevenueAgg, totalOrders, totalCustomers, totalAppointments] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.appointment.count(),
  ]);

  return {
    totalRevenue: totalRevenueAgg._sum.total ?? 0,
    totalOrders,
    totalCustomers,
    totalAppointments,
    revenueChange: 0,
    ordersChange: 0,
    customersChange: 0,
    appointmentsChange: 0,
  };
}
