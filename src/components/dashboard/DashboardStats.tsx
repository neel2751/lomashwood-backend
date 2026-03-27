"use client";

import { useMemo } from "react";

import { useAppointments } from "@/hooks/useAppointments";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";

import { StatsCard } from "@/components/dashboard/StatsCard";

type OrderRecord = {
  id: string;
  total?: number;
  createdAt?: string;
};

type CustomerRecord = {
  id: string;
  createdAt?: string;
};

type AppointmentRecord = {
  id: string;
  createdAt?: string;
};

function isWithinRange(value: string | undefined, start: Date, end: Date) {
  if (!value) return false;
  const date = new Date(value);
  return date >= start && date <= end;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function DashboardStats() {
  const ordersQuery = useOrders({ page: 1, limit: 1000 });
  const appointmentsQuery = useAppointments({ page: 1, limit: 1000 });
  const customersQuery = useCustomers({ page: 1, limit: 1000 });

  const orders = useMemo(
    () => ((ordersQuery.data as { data?: OrderRecord[] } | undefined)?.data ?? []) as OrderRecord[],
    [ordersQuery.data],
  );

  const appointments = useMemo(
    () =>
      ((appointmentsQuery.data as { data?: AppointmentRecord[] } | undefined)?.data ??
        []) as AppointmentRecord[],
    [appointmentsQuery.data],
  );

  const customers = useMemo(
    () =>
      ((customersQuery.data as { data?: CustomerRecord[] } | undefined)?.data ??
        []) as CustomerRecord[],
    [customersQuery.data],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 29);

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(currentStart.getDate() - 1);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - 29);

    const currentRevenue = orders
      .filter((order) => isWithinRange(order.createdAt, currentStart, now))
      .reduce((sum, order) => sum + (order.total ?? 0), 0);

    const previousRevenue = orders
      .filter((order) => isWithinRange(order.createdAt, previousStart, previousEnd))
      .reduce((sum, order) => sum + (order.total ?? 0), 0);

    const currentOrders = Number(
      (ordersQuery.data as { total?: number } | undefined)?.total ?? orders.length,
    );
    const previousOrders = orders.filter((order) =>
      isWithinRange(order.createdAt, previousStart, previousEnd),
    ).length;

    const currentAppointments = Number(
      (appointmentsQuery.data as { total?: number } | undefined)?.total ?? appointments.length,
    );
    const previousAppointments = appointments.filter((item) =>
      isWithinRange(item.createdAt, previousStart, previousEnd),
    ).length;

    const currentCustomers = customers.filter((item) =>
      isWithinRange(item.createdAt, currentStart, now),
    ).length;
    const previousCustomers = customers.filter((item) =>
      isWithinRange(item.createdAt, previousStart, previousEnd),
    ).length;

    return [
      {
        title: "Total Revenue",
        value: Math.round(currentRevenue).toLocaleString("en-GB"),
        prefix: "£",
        change: percentageChange(currentRevenue, previousRevenue),
        changeLabel: "vs previous 30 days",
        iconName: "PoundSterling" as const,
        iconColor: "text-[#C8924A]",
        iconBg: "bg-[#C8924A]/15",
      },
      {
        title: "Orders",
        value: currentOrders.toLocaleString("en-GB"),
        change: percentageChange(currentOrders, previousOrders),
        changeLabel: "vs previous 30 days",
        iconName: "ShoppingCart" as const,
        iconColor: "text-emerald-400",
        iconBg: "bg-emerald-400/10",
      },
      {
        title: "Appointments",
        value: currentAppointments.toLocaleString("en-GB"),
        change: percentageChange(currentAppointments, previousAppointments),
        changeLabel: "vs previous 30 days",
        iconName: "CalendarCheck" as const,
        iconColor: "text-[#6B8A9A]",
        iconBg: "bg-[#6B8A9A]/15",
      },
      {
        title: "New Customers",
        value: currentCustomers.toLocaleString("en-GB"),
        change: percentageChange(currentCustomers, previousCustomers),
        changeLabel: "vs previous 30 days",
        iconName: "Users" as const,
        iconColor: "text-violet-400",
        iconBg: "bg-violet-400/10",
      },
    ];
  }, [appointments, appointmentsQuery.data, customers, orders, ordersQuery.data]);

  const isLoading =
    ordersQuery.isLoading || appointmentsQuery.isLoading || customersQuery.isLoading;

  return (
    <>
      {stats.map((stat) => (
        <StatsCard key={stat.title} {...stat} loading={isLoading} />
      ))}
    </>
  );
}
