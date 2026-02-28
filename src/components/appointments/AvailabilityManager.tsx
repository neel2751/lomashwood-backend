"use client";

import { useState } from "react";

import {
  CalendarOff, Plus, Trash2, ChevronDown,
  CalendarCheck, Save, AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { TimeSlotEditor } from "./TimeSlotEditor";

interface DateOverride {
  id: string;
  date: string;
  type: "closed" | "custom_hours";
  from?: string;
  to?: string;
  reason: string;
}

const DEFAULT_OVERRIDES: DateOverride[] = [
  { id: "1", date: "2026-03-15", type: "closed",       reason: "Bank Holiday"              },
  { id: "2", date: "2026-03-20", type: "custom_hours", from: "10:00", to: "14:00", reason: "Half day — trade event" },
  { id: "3", date: "2026-04-03", type: "closed",       reason: "Good Friday"               },
];

const CONSULTANTS = ["Sarah Alderton", "Marcus Webb", "Jade Nguyen"];

function uid() { return Math.random().toString(36).slice(2, 8); }

export function AvailabilityManager() {
  const [consultant, setConsultant] = useState(CONSULTANTS[0]);
  const [overrides, setOverrides]   = useState<DateOverride[]>(DEFAULT_OVERRIDES);
  const [showAddOverride, setShow]  = useState(false);

  // New override form state
  const [newDate, setNewDate]   = useState("");
  const [newType, setNewType]   = useState<"closed" | "custom_hours">("closed");
  const [newFrom, setNewFrom]   = useState("09:00");
  const [newTo, setNewTo]       = useState("17:00");
  const [newReason, setNewReason] = useState("");
  const [overrideSaved, setOverrideSaved] = useState(false);

  const addOverride = () => {
    if (!newDate || !newReason) return;
    setOverrides((prev) => [
      ...prev,
      {
        id: uid(),
        date: newDate,
        type: newType,
        from: newType === "custom_hours" ? newFrom : undefined,
        to:   newType === "custom_hours" ? newTo   : undefined,
        reason: newReason,
      },
    ]);
    setNewDate(""); setNewReason(""); setShow(false);
    setOverrideSaved(true);
    setTimeout(() => setOverrideSaved(false), 2000);
  };

  const removeOverride = (id: string) =>
    setOverrides((prev) => prev.filter((o) => o.id !== id));

  const inputCls = "h-9 px-3 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="flex flex-col gap-5">
      {/* Consultant selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[13px] font-medium text-[#C8B99A]">Managing availability for:</p>
        <div className="relative">
          <select
            value={consultant}
            onChange={(e) => setConsultant(e.target.value)}
            className="appearance-none h-9 pl-3 pr-8 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] font-semibold text-[#C8924A] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
          >
            {CONSULTANTS.map((c) => (
              <option key={c} value={c} className="bg-[#1C1611] font-normal text-[#E8D5B7]">{c}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>
      </div>

      {/* Weekly time slots */}
      <TimeSlotEditor consultantName={consultant} />

      {/* Date overrides */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
          <div>
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] flex items-center gap-2">
              <CalendarOff size={15} className="text-[#C8924A]" />
              Date Overrides
            </h3>
            <p className="text-[12px] text-[#5A4232] mt-0.5">Holidays, half days, and special closures</p>
          </div>
          <button
            onClick={() => setShow((v) => !v)}
            className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#C8924A] text-white text-[12px] font-medium hover:bg-[#B87E3E] transition-colors">
            <Plus size={13} /> Add Override
          </button>
        </div>

        {/* Add form */}
        {showAddOverride && (
          <div className="px-5 py-4 border-b border-[#2E231A] bg-[#221A12] flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#3D2E1E] mb-1">Date</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className={cn(inputCls, "w-full")} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#3D2E1E] mb-1">Type</label>
                <div className="relative">
                  <select value={newType} onChange={(e) => setNewType(e.target.value as any)}
                    className={cn(inputCls, "w-full appearance-none pr-7")}>
                    <option value="closed" className="bg-[#1C1611]">Closed</option>
                    <option value="custom_hours" className="bg-[#1C1611]">Custom Hours</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>
              {newType === "custom_hours" && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#3D2E1E] mb-1">From</label>
                    <input type="time" value={newFrom} onChange={(e) => setNewFrom(e.target.value)}
                      className={cn(inputCls, "w-full")} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#3D2E1E] mb-1">To</label>
                    <input type="time" value={newTo} onChange={(e) => setNewTo(e.target.value)}
                      className={cn(inputCls, "w-full")} />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#3D2E1E] mb-1">Reason</label>
              <input value={newReason} onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. Bank Holiday, Team meeting…"
                className={cn(inputCls, "w-full")} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addOverride}
                disabled={!newDate || !newReason}
                className="flex items-center gap-2 h-8 px-3 rounded-[8px] bg-[#C8924A] text-white text-[12px] font-medium hover:bg-[#B87E3E] disabled:opacity-50 disabled:pointer-events-none transition-all">
                <Save size={12} /> Save Override
              </button>
              <button onClick={() => setShow(false)}
                className="h-8 px-3 rounded-[8px] text-[12px] text-[#5A4232] hover:text-[#C8924A] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Override list */}
        <div className="divide-y divide-[#2E231A]">
          {overrides.length === 0 && (
            <div className="px-5 py-6 text-center">
              <CalendarCheck size={20} className="text-[#3D2E1E] mx-auto mb-2" />
              <p className="text-[12px] text-[#3D2E1E]">No overrides configured</p>
            </div>
          )}
          {overrides.map((override) => (
            <div key={override.id} className="flex items-center justify-between px-5 py-3.5 group hover:bg-[#221A12] transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0",
                  override.type === "closed" ? "bg-red-400/10" : "bg-[#C8924A]/15"
                )}>
                  {override.type === "closed"
                    ? <CalendarOff size={14} className="text-red-400" />
                    : <AlertTriangle size={14} className="text-[#C8924A]" />
                  }
                </div>
                <div>
                  <p className="text-[12.5px] font-medium text-[#C8B99A]">
                    {new Date(override.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-[11px] text-[#5A4232] mt-0.5">
                    {override.type === "closed"
                      ? "Closed — " + override.reason
                      : `${override.from} – ${override.to} · ${override.reason}`}
                  </p>
                </div>
              </div>
              <button onClick={() => removeOverride(override.id)}
                className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}