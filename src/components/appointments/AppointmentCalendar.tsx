"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type AppType = "home" | "showroom" | "online";

type CalendarAppointment = {
  id: string;
  customerName: string;
  type: AppType;
  slot: string;
  consultantName?: string;
};

type Props = {
  appointments: CalendarAppointment[];
  isLoading?: boolean;
};

const TYPE_COLORS: Record<AppType, string> = {
  home: "bg-[#FFF3DC] border-[#D4820A] text-[#8B5E00]",
  showroom: "bg-[#EBF4FB] border-[#2980B9] text-[#1A5A96]",
  online: "bg-[#DCF4EA] border-[#16A34A] text-[#15803D]",
};

const TYPE_LABELS: Record<AppType, string> = {
  home: "Home",
  showroom: "Showroom",
  online: "Online",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);

function getWeekStart(date: Date) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
}

function timeToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function getWeekDates(start: Date): Date[] {
  return DAYS.map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function getDurationByType(type: AppType) {
  if (type === "home") return 90;
  if (type === "online") return 45;
  return 60;
}

export function AppointmentCalendar({ appointments, isLoading }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [consultant, setConsultant] = useState("All");

  const baseWeekStart = getWeekStart(new Date());
  const weekStart = new Date(baseWeekStart);
  weekStart.setDate(baseWeekStart.getDate() + weekOffset * 7);
  const dates = getWeekDates(weekStart);

  const consultants = useMemo(
    () => ["All", ...new Set(appointments.map((item) => item.consultantName || "Unassigned"))],
    [appointments],
  );

  const filtered = useMemo(
    () => appointments.filter((item) => consultant === "All" || (item.consultantName || "Unassigned") === consultant),
    [appointments, consultant],
  );

  const CELL_PX_PER_MIN = 1.2;

  return (
    <div className="rounded-[16px] bg-[#FFFFFF] border border-[#E8E6E1] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E6E1] flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((value) => value - 1)} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[#F5F3EF] border border-[#E8E6E1] text-[#6B6B68] hover:text-[#C8924A] hover:bg-[#FFF3DC] transition-all">
            <ChevronLeft size={14} />
          </button>
          <span className="text-[13px] font-semibold text-[#1A1A18] min-w-[200px] text-center">
            {dates[0]?.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {dates[6]?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button onClick={() => setWeekOffset((value) => value + 1)} className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[#F5F3EF] border border-[#E8E6E1] text-[#6B6B68] hover:text-[#C8924A] hover:bg-[#FFF3DC] transition-all">
            <ChevronRight size={14} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[11px] text-[#C8924A] hover:underline ml-1">Today</button>
          )}
        </div>

        <div className="flex gap-1 bg-[#F5F3EF] rounded-[8px] p-0.5 ml-auto flex-wrap">
          {consultants.map((item) => (
            <button
              key={item}
              onClick={() => setConsultant(item)}
              className={cn(
                "px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all",
                consultant === item ? "bg-[#C8924A] text-white" : "text-[#6B6B68] hover:text-[#C8924A] hover:bg-[#FFF3DC]"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <Link href="/appointments/new" className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#C8924A] text-white text-[12px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={13} /> New
        </Link>
      </div>

      <div className="flex items-center gap-4 px-5 py-2 border-b border-[#E8E6E1] bg-[#F5F3EF]">
        {(Object.entries(TYPE_LABELS) as [AppType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn("w-3 h-3 rounded-[3px] border", TYPE_COLORS[type])} />
            <span className="text-[11px] text-[#6B6B68]">{label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="p-5 text-[12.5px] text-[#6B6B68]">Loading calendar...</div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: "600px" }}>
          <div className="flex min-w-[700px]">
            <div className="w-14 shrink-0 border-r border-[#E8E6E1] bg-[#F5F3EF]">
              <div className="h-10" />
              {HOURS.map((hour) => (
                <div key={hour} className="h-[72px] flex items-start pt-1 pr-2 justify-end border-b border-[#E8E6E1]">
                  <span className="text-[10px] text-[#6B6B68]">{hour.toString().padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>

            {DAYS.map((day, dayIdx) => {
              const date = dates[dayIdx];
              if (!date) return null;

              const isToday = date.toDateString() === new Date().toDateString();
              const dayAppointments = filtered.filter((item) => {
                const slotDate = new Date(item.slot);
                return slotDate.toDateString() === date.toDateString();
              });

              return (
                <div key={day} className="flex-1 min-w-0 border-r border-[#E8E6E1] last:border-r-0">
                  <div className={cn("h-10 flex flex-col items-center justify-center border-b border-[#E8E6E1] sticky top-0 z-10", isToday ? "bg-[#FFF3DC]" : "bg-[#FFFFFF]")}>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider", isToday ? "text-[#D4820A]" : "text-[#6B6B68]")}>{day}</span>
                    <span className={cn("text-[12px] font-bold leading-none", isToday ? "text-[#D4820A]" : "text-[#1A1A18]")}>{date.getDate()}</span>
                  </div>

                  <div className="relative bg-[#FFFFFF]">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-[72px] border-b border-[#EEECE8] hover:bg-[#F5F3EF] transition-colors" />
                    ))}

                    {dayAppointments.map((appointment) => {
                      const slotDate = new Date(appointment.slot);
                      const startMin = timeToMinutes(slotDate) - 8 * 60;
                      const topPx = startMin * CELL_PX_PER_MIN;
                      const heightPx = Math.max(getDurationByType(appointment.type) * CELL_PX_PER_MIN, 28);

                      return (
                        <Link
                          key={appointment.id}
                          href={`/appointments/${appointment.id}`}
                          className={cn(
                            "absolute inset-x-1 rounded-[6px] border-2 px-2 py-1.5 overflow-hidden",
                            "hover:shadow-md transition-all group cursor-pointer font-medium",
                            TYPE_COLORS[appointment.type]
                          )}
                          style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                        >
                          <p className="text-[10px] font-bold leading-tight truncate">{appointment.customerName}</p>
                          {heightPx > 36 && (
                            <p className="text-[9px] leading-tight truncate opacity-90">
                              {slotDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {TYPE_LABELS[appointment.type]}
                            </p>
                          )}
                          {heightPx > 52 && (
                            <p className="text-[9px] leading-tight truncate opacity-75">{appointment.consultantName || 'Unassigned'}</p>
                          )}
                        </Link>
                      );
                    })}
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