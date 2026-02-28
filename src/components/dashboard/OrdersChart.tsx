"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const WEEKLY_DATA = [
  { day: "Mon", completed: 12, pending: 5, refunded: 1 },
  { day: "Tue", completed: 18, pending: 7, refunded: 2 },
  { day: "Wed", completed: 9,  pending: 4, refunded: 0 },
  { day: "Thu", completed: 21, pending: 9, refunded: 1 },
  { day: "Fri", completed: 25, pending: 6, refunded: 3 },
  { day: "Sat", completed: 14, pending: 3, refunded: 0 },
  { day: "Sun", completed: 6,  pending: 2, refunded: 0 },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "#C8924A",
  pending: "#6B8A9A",
  refunded: "#7A4232",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1611] border border-[#3D2E1E] rounded-[10px] px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-[#5A4232] mb-1.5 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
          <span className="text-[12px] text-[#9A7A5A] capitalize">{entry.dataKey}:</span>
          <span className="text-[12px] font-semibold text-[#E8D5B7]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const LEGEND = [
  { key: "completed", label: "Completed" },
  { key: "pending",   label: "Pending" },
  { key: "refunded",  label: "Refunded" },
];

export function OrdersChart() {
  const totalOrders = WEEKLY_DATA.reduce(
    (sum, d) => sum + d.completed + d.pending + d.refunded,
    0
  );

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Orders This Week</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">
            <span className="text-[#C8924A] font-semibold">{totalOrders}</span> total orders
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {LEGEND.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: STATUS_COLORS[key] }}
              />
              <span className="text-[11px] text-[#5A4232]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={WEEKLY_DATA}
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
          <YAxis
            tick={{ fill: "#5A4232", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2E231A", radius: 4 }} />
          <Bar dataKey="completed" fill="#C8924A" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending"   fill="#6B8A9A" radius={[4, 4, 0, 0]} />
          <Bar dataKey="refunded"  fill="#7A4232" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}