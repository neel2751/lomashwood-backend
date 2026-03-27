"use client";

import { useMemo } from "react";

import { Home, Monitor, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { useAppointments } from "@/hooks/useAppointments";

type AppointmentRecord = {
  id: string;
  type: "home" | "online" | "showroom";
  slot: string;
};

const DATA_CONFIG = [
  { label: "Home Measurement", key: "home", color: "#C8924A", icon: Home },
  { label: "Online", key: "online", color: "#6B8A9A", icon: Monitor },
  { label: "Showroom", key: "showroom", color: "#8B6B4A", icon: MapPin },
] as const;

interface TooltipPayloadEntry {
  payload: { label: string; key: string; value: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (!entry) return null;
  const d = entry.payload;
  return (
    <div className="rounded-[10px] border border-[#3D2E1E] bg-[#1C1611] px-3 py-2 shadow-xl">
      <p className="text-[12px] font-semibold text-[#E8D5B7]">{d.label}</p>
      <p className="text-[11px] text-[#5A4232]">{d.value} appointments</p>
    </div>
  );
}

export function AppointmentsChart() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = monthStart.toISOString().slice(0, 10);
  const endDate = now.toISOString().slice(0, 10);

  const appointmentsQuery = useAppointments({ page: 1, limit: 1000, startDate, endDate });
  const appointments = ((appointmentsQuery.data as { data?: AppointmentRecord[] } | undefined)
    ?.data ?? []) as AppointmentRecord[];

  const data = useMemo(() => {
    const counts = appointments.reduce(
      (acc, item) => {
        acc[item.type] += 1;
        return acc;
      },
      { home: 0, online: 0, showroom: 0 },
    );

    return DATA_CONFIG.map((item) => ({
      ...item,
      value: counts[item.key],
    }));
  }, [appointments]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-[16px] border border-[#2E231A] bg-[#1C1611] p-5">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Appointments</h3>
        <p className="mt-0.5 text-[12px] text-[#5A4232]">By type — this month</p>
      </div>

      {appointmentsQuery.isLoading ? (
        <div className="flex h-[120px] items-center justify-center text-[13px] text-[#5A4232]">
          Loading appointments...
        </div>
      ) : appointmentsQuery.isError ? (
        <div className="flex h-[120px] items-center justify-center text-[13px] text-red-400">
          Failed to load appointments.
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-[120px] w-[120px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold leading-none text-[#E8D5B7]">{total}</span>
              <span className="mt-0.5 text-[10px] leading-none text-[#5A4232]">total</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {data.map(({ label, key, value, color, icon: Icon }) => {
              const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]"
                    style={{ background: `${color}20` }}
                  >
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-[11.5px] text-[#9A7A5A]">{label}</span>
                      <span className="ml-2 shrink-0 text-[11px] font-semibold text-[#E8D5B7]">
                        {value}
                      </span>
                    </div>

                    <div className="h-1 w-full rounded-full bg-[#2E231A]">
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
      )}
    </div>
  );
}
