"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type AppType = "home_visit" | "showroom" | "online";

interface CalendarAppt {
  id: string;
  customer: string;
  type: AppType;
  time: string;     // "HH:MM"
  duration: number; // minutes
  consultant: string;
  day: number;      // 0=Mon … 6=Sun
}

const TYPE_COLORS: Record<AppType, string> = {
  home_visit: "bg-[#C8924A]/20 border-[#C8924A]/40 text-[#C8924A]",
  showroom:   "bg-[#6B8A9A]/20 border-[#6B8A9A]/40 text-[#6B8A9A]",
  online:     "bg-emerald-400/10 border-emerald-400/30 text-emerald-400",
};

const TYPE_LABELS: Record<AppType, string> = {
  home_visit: "Home",
  showroom:   "Showroom",
  online:     "Online",
};

// Week starting Mon 2 Mar 2026
const WEEK_START = new Date(2026, 2, 2);
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 08:00 – 17:00

const MOCK_APPTS: CalendarAppt[] = [
  { id: "1", customer: "James Thornton",  type: "home_visit", time: "10:00", duration: 90,  consultant: "Sarah Alderton", day: 2 },
  { id: "2", customer: "Priya Sharma",    type: "showroom",   time: "14:30", duration: 60,  consultant: "Marcus Webb",    day: 2 },
  { id: "3", customer: "Oliver Patel",    type: "online",     time: "09:00", duration: 45,  consultant: "Sarah Alderton", day: 3 },
  { id: "4", customer: "Emma Lawson",     type: "home_visit", time: "11:30", duration: 90,  consultant: "Jade Nguyen",    day: 3 },
  { id: "5", customer: "Daniel Huang",    type: "showroom",   time: "13:00", duration: 60,  consultant: "Marcus Webb",    day: 4 },
  { id: "6", customer: "Sophie Clark",    type: "online",     time: "10:00", duration: 45,  consultant: "Jade Nguyen",    day: 0 },
  { id: "7", customer: "Ryan Foster",     type: "home_visit", time: "15:00", duration: 120, consultant: "Sarah Alderton", day: 1 },
];

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getWeekDates(start: Date) {
  return DAYS.map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const CONSULTANTS = ["All", "Sarah Alderton", "Marcus Webb", "Jade Nguyen"];

export function AppointmentCalendar() {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [consultant, setConsultant]   = useState("All");

  const weekStart = new Date(WEEK_START);
  weekStart.setDate(WEEK_START.getDate() + weekOffset * 7);
  const dates = getWeekDates(weekStart);

  const filtered = MOCK_APPTS.filter(
    (a) => consultant === "All" || a.consultant === consultant
  );

  const CELL_PX_PER_MIN = 1.2; // px per minute

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        {/* Week nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-all">
            <ChevronLeft size={14} />
          </button>
          <span className="text-[13px] font-semibold text-[#E8D5B7] min-w-[200px] text-center">
            {dates[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} —{" "}
            {dates[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-all">
            <ChevronRight size={14} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              className="text-[11px] text-[#C8924A] hover:underline ml-1">Today</button>
          )}
        </div>

        {/* Consultant filter pills */}
        <div className="flex gap-1 bg-[#2E231A] rounded-[8px] p-0.5 ml-auto flex-wrap">
          {CONSULTANTS.map((c) => (
            <button key={c} onClick={() => setConsultant(c)}
              className={cn("px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all",
                consultant === c ? "bg-[#C8924A] text-white" : "text-[#5A4232] hover:text-[#C8924A]")}>
              {c}
            </button>
          ))}
        </div>

        <Link href="/appointments/new"
          className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#C8924A] text-white text-[12px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={13} /> New
        </Link>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-[#2E231A] bg-[#1A100C]">
        {(Object.entries(TYPE_LABELS) as [AppType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn("w-3 h-3 rounded-[3px] border", TYPE_COLORS[type])} />
            <span className="text-[11px] text-[#5A4232]">{label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-auto" style={{ maxHeight: "600px" }}>
        <div className="flex min-w-[700px]">
          {/* Hour labels */}
          <div className="w-14 shrink-0 border-r border-[#2E231A]">
            <div className="h-10" /> {/* header spacer */}
            {HOURS.map((h) => (
              <div key={h} className="h-[72px] flex items-start pt-1 pr-2 justify-end border-b border-[#2E231A]">
                <span className="text-[10px] text-[#3D2E1E]">{h.toString().padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day, dayIdx) => {
            const date   = dates[dayIdx];
            const isToday = date.toDateString() === new Date().toDateString();
            const dayAppts = filtered.filter((a) => a.day === dayIdx);

            return (
              <div key={day} className="flex-1 min-w-0 border-r border-[#2E231A] last:border-r-0">
                {/* Day header */}
                <div className={cn(
                  "h-10 flex flex-col items-center justify-center border-b border-[#2E231A] sticky top-0 z-10",
                  isToday ? "bg-[#C8924A]/10" : "bg-[#1A100C]"
                )}>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider",
                    isToday ? "text-[#C8924A]" : "text-[#5A4232]")}>{day}</span>
                  <span className={cn("text-[12px] font-bold leading-none",
                    isToday ? "text-[#C8924A]" : "text-[#3D2E1E]")}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Hour slots */}
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="h-[72px] border-b border-[#2E231A] hover:bg-[#221A12] transition-colors" />
                  ))}

                  {/* Appointment blocks */}
                  {dayAppts.map((appt) => {
                    const startMin = timeToMinutes(appt.time) - 8 * 60;
                    const topPx    = startMin * CELL_PX_PER_MIN;
                    const heightPx = Math.max(appt.duration * CELL_PX_PER_MIN, 28);

                    return (
                      <Link
                        key={appt.id}
                        href={`/appointments/${appt.id}`}
                        className={cn(
                          "absolute inset-x-1 rounded-[6px] border px-1.5 py-1 overflow-hidden",
                          "hover:opacity-90 hover:shadow-lg transition-all group cursor-pointer",
                          TYPE_COLORS[appt.type]
                        )}
                        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      >
                        <p className="text-[10.5px] font-semibold leading-tight truncate">{appt.customer}</p>
                        {heightPx > 36 && (
                          <p className="text-[9.5px] opacity-70 leading-tight truncate">{appt.time} · {TYPE_LABELS[appt.type]}</p>
                        )}
                        {heightPx > 52 && (
                          <p className="text-[9.5px] opacity-60 leading-tight truncate">{appt.consultant}</p>
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
    </div>
  );
}