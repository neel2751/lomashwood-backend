"use client";

import { CalendarCheck, PoundSterling, ShoppingCart, Users } from "lucide-react";

import { MetricCard } from "@/components/analytics/MetricCard";
import { useAnalyticsOverview } from "@/hooks/useAnalytics";

type OverviewPayload = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalAppointments: number;
  revenueChange?: number;
  ordersChange?: number;
  customersChange?: number;
  appointmentsChange?: number;
};

export function OverviewMetrics() {
  const overviewQuery = useAnalyticsOverview();

  const raw = overviewQuery.data as OverviewPayload | { data?: OverviewPayload } | undefined;
  const overview = (raw && "data" in raw ? raw.data : raw) as OverviewPayload | undefined;

  const cards = [
    {
      title: "Total Revenue",
      value: Math.round(overview?.totalRevenue ?? 0).toLocaleString("en-GB"),
      prefix: "£",
      change: overview?.revenueChange ?? 0,
      icon: PoundSterling,
      iconColor: "text-[#C8924A]",
      iconBg: "bg-[#C8924A]/15",
    },
    {
      title: "Orders",
      value: overview?.totalOrders ?? 0,
      change: overview?.ordersChange ?? 0,
      icon: ShoppingCart,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-400/10",
    },
    {
      title: "Appointments",
      value: overview?.totalAppointments ?? 0,
      change: overview?.appointmentsChange ?? 0,
      icon: CalendarCheck,
      iconColor: "text-[#6B8A9A]",
      iconBg: "bg-[#6B8A9A]/15",
    },
    {
      title: "Customers",
      value: overview?.totalCustomers ?? 0,
      change: overview?.customersChange ?? 0,
      icon: Users,
      iconColor: "text-violet-400",
      iconBg: "bg-violet-400/10",
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} loading={overviewQuery.isLoading} />
      ))}
    </>
  );
}
