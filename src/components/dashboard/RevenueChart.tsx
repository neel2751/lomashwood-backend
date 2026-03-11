"use client";

import { useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { cn } from "@/lib/utils";
import { useOrders } from "@/hooks/useOrders";

interface OrderItem {
  productCategory?: string;
  totalPrice?: number;
}

interface Order {
  id: string;
  createdAt?: string;
  items?: OrderItem[];
}

const RANGES = ["6M", "12M"] as const;
type Range = (typeof RANGES)[number];

const gbNumber = new Intl.NumberFormat("en-GB");

interface TooltipPayloadEntry {
  dataKey: string;
  color: string;
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
    <div className="bg-[#1C1611] border border-[#3D2E1E] rounded-[10px] px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-[#5A4232] mb-1.5 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[12px] text-[#9A7A5A] capitalize">{entry.dataKey}:</span>
          <span className="text-[12px] font-semibold text-[#E8D5B7]">
            £{gbNumber.format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart() {
  const [range, setRange] = useState<Range>("6M");

  const { data: ordersData, isLoading, isError } = useOrders({ page: 1, limit: 500 });
  const orders = ((ordersData as { data?: Order[] } | undefined)?.data ?? []) as Order[];

  const monthsBack = range === "6M" ? 6 : 12;
  const monthBuckets = Array.from({ length: monthsBack }, (_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (monthsBack - 1 - idx));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const month = d.toLocaleDateString("en-GB", { month: "short" });
    return { key, month, kitchen: 0, bedroom: 0 };
  });

  const bucketMap = new Map(monthBuckets.map((b) => [b.key, b]));

  orders.forEach((order) => {
    if (!order.createdAt) return;
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) return;

    (order.items ?? []).forEach((item) => {
      const amount = item.totalPrice ?? 0;
      if (item.productCategory?.toLowerCase() === "bedroom") {
        bucket.bedroom += amount;
      } else {
        bucket.kitchen += amount;
      }
    });
  });

  const data = monthBuckets.map(({ month, kitchen, bedroom }) => ({ month, kitchen, bedroom }));

  const totalKitchen = data.reduce((s, d) => s + d.kitchen, 0);
  const totalBedroom = data.reduce((s, d) => s + d.bedroom, 0);

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Revenue Overview</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Kitchen & Bedroom sales</p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-[#2E231A] rounded-[8px] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all",
                range === r
                  ? "bg-[#C8924A] text-white"
                  : "text-[#5A4232] hover:text-[#C8924A]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8924A]" />
          <span className="text-[11px] text-[#5A4232]">Kitchen</span>
          <span className="text-[13px] font-semibold text-[#E8D5B7]">
            £{gbNumber.format(totalKitchen)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6B8A9A]" />
          <span className="text-[11px] text-[#5A4232]">Bedroom</span>
          <span className="text-[13px] font-semibold text-[#E8D5B7]">
            £{gbNumber.format(totalBedroom)}
          </span>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center text-[13px] text-[#5A4232]">Loading revenue...</div>
      ) : isError ? (
        <div className="h-[200px] flex items-center justify-center text-[13px] text-red-400">Failed to load revenue data.</div>
      ) : (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="kitchenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C8924A" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#C8924A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bedroomGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6B8A9A" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6B8A9A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2E231A" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#5A4232", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#5A4232", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="kitchen"
            stroke="#C8924A"
            strokeWidth={2}
            fill="url(#kitchenGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#C8924A", stroke: "#1C1611", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="bedroom"
            stroke="#6B8A9A"
            strokeWidth={2}
            fill="url(#bedroomGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#6B8A9A", stroke: "#1C1611", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}