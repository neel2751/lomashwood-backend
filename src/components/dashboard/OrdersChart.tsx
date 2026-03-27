"use client";

import { useMemo } from "react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { useOrders } from "@/hooks/useOrders";

type OrderRecord = {
  id: string;
  status?: string;
  createdAt?: string;
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#C8924A",
  pending: "#6B8A9A",
  refunded: "#7A4232",
};

interface TooltipPayloadEntry {
  dataKey: string;
  fill: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-[#3D2E1E] bg-[#1C1611] px-3 py-2.5 shadow-xl">
      <p className="mb-1.5 text-[11px] font-medium text-[#5A4232]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.fill }} />
          <span className="text-[12px] capitalize text-[#9A7A5A]">{entry.dataKey}:</span>
          <span className="text-[12px] font-semibold text-[#E8D5B7]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const LEGEND = [
  { key: "completed", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "refunded", label: "Refunded" },
];

export function OrdersChart() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const ordersQuery = useOrders({ page: 1, limit: 1000 });
  const orders = ((ordersQuery.data as { data?: OrderRecord[] } | undefined)?.data ??
    []) as OrderRecord[];

  const weeklyData = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const buckets = labels.map((day) => ({ day, completed: 0, pending: 0, refunded: 0 }));

    orders.forEach((order) => {
      if (!order.createdAt) return;

      const createdAt = new Date(order.createdAt);
      if (createdAt < weekStart || createdAt > weekEnd) return;

      const dayIndex = createdAt.getDay() === 0 ? 6 : createdAt.getDay() - 1;
      const bucket = buckets[dayIndex];
      if (!bucket) return;

      const status = (order.status ?? "pending").toLowerCase();
      if (status === "refunded" || status === "cancelled") {
        bucket.refunded += 1;
      } else if (status === "pending") {
        bucket.pending += 1;
      } else {
        bucket.completed += 1;
      }
    });

    return buckets;
  }, [orders, weekEnd, weekStart]);

  const totalOrders = weeklyData.reduce((sum, d) => sum + d.completed + d.pending + d.refunded, 0);

  return (
    <div className="rounded-[16px] border border-[#2E231A] bg-[#1C1611] p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Orders This Week</h3>
          <p className="mt-0.5 text-[12px] text-[#5A4232]">
            <span className="font-semibold text-[#C8924A]">{totalOrders}</span> total orders
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {LEGEND.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[key] }} />
              <span className="text-[11px] text-[#5A4232]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {ordersQuery.isLoading ? (
        <div className="flex h-[180px] items-center justify-center text-[13px] text-[#5A4232]">
          Loading weekly orders...
        </div>
      ) : ordersQuery.isError ? (
        <div className="flex h-[180px] items-center justify-center text-[13px] text-red-400">
          Failed to load weekly orders.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={weeklyData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            barSize={10}
            barGap={3}
          >
            <CartesianGrid stroke="#2E231A" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#5A4232", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: "#5A4232", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2E231A", radius: 4 }} />
            <Bar dataKey="completed" fill="#C8924A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="#6B8A9A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="refunded" fill="#7A4232" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
