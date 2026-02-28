"use client";

import { Home, Monitor, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const DATA = [
  { label: "Home Measurement", key: "home",     value: 42, color: "#C8924A", icon: Home },
  { label: "Online",           key: "online",   value: 28, color: "#6B8A9A", icon: Monitor },
  { label: "Showroom",         key: "showroom", value: 30, color: "#8B6B4A", icon: MapPin },
];

const total = DATA.reduce((s, d) => s + d.value, 0);

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1C1611] border border-[#3D2E1E] rounded-[10px] px-3 py-2 shadow-xl">
      <p className="text-[12px] font-semibold text-[#E8D5B7]">{d.label}</p>
      <p className="text-[11px] text-[#5A4232]">{d.value} appointments</p>
    </div>
  );
}

export function AppointmentsChart() {
  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Appointments</h3>
        <p className="text-[12px] text-[#5A4232] mt-0.5">By type — this month</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative shrink-0 w-[120px] h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DATA}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {DATA.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[20px] font-bold text-[#E8D5B7] leading-none">{total}</span>
            <span className="text-[10px] text-[#5A4232] leading-none mt-0.5">total</span>
          </div>
        </div>

        {/* Legend list */}
        <div className="flex-1 flex flex-col gap-3">
          {DATA.map(({ label, key, value, color, icon: Icon }) => {
            const pct = ((value / total) * 100).toFixed(0);
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-[7px]"
                  style={{ background: `${color}20` }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11.5px] text-[#9A7A5A] truncate">{label}</span>
                    <span className="text-[11px] font-semibold text-[#E8D5B7] ml-2 shrink-0">{value}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 rounded-full bg-[#2E231A]">
                    <div
                      className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}