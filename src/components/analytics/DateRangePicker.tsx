"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const today = startOfToday();

const PRESETS: DateRange[] = [
  { label: "Today",        from: today,               to: today                    },
  { label: "Last 7 days",  from: addDays(today, -6),  to: today                    },
  { label: "Last 30 days", from: addDays(today, -29), to: today                    },
  { label: "Last 90 days", from: addDays(today, -89), to: today                    },
  { label: "This month",   from: new Date(today.getFullYear(), today.getMonth(), 1), to: today },
  { label: "Last month",   from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 0) },
  { label: "This year",    from: new Date(today.getFullYear(), 0, 1), to: today    },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-[10px] transition-all",
          "bg-[#2E231A] border border-[#3D2E1E] text-[#9A7A5A]",
          "hover:border-[#C8924A]/40 hover:text-[#E8D5B7]",
          open && "border-[#C8924A]/40 text-[#E8D5B7]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8924A]/40"
        )}
      >
        <CalendarDays size={14} className="text-[#C8924A]" />
        <span className="text-[12.5px] font-medium">{value.label}</span>
        <span className="text-[11px] text-[#5A4232] hidden sm:block">
          {formatDate(value.from)} – {formatDate(value.to)}
        </span>
        <ChevronDown size={13} className={cn("text-[#5A4232] transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] bg-[#1C1611] border border-[#2E231A] rounded-[14px] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="p-1.5">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E]">
              Presets
            </p>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onChange(preset);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[12.5px] transition-all",
                  value.label === preset.label
                    ? "bg-[#C8924A]/15 text-[#C8924A] font-medium"
                    : "text-[#7A6045] hover:bg-[#2E231A] hover:text-[#C8924A]"
                )}
              >
                <span>{preset.label}</span>
                {value.label === preset.label && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8924A]" />
                )}
              </button>
            ))}
          </div>

          {/* Custom range hint */}
          <div className="border-t border-[#2E231A] px-4 py-2.5">
            <p className="text-[11px] text-[#3D2E1E]">Custom range coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}