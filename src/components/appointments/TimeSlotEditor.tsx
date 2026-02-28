"use client";

import { useState } from "react";
import { Plus, Trash2, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface TimeSlot {
  id: string;
  from: string;
  to: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

const DAY_LABELS: Record<Day, string> = {
  monday:    "Monday",
  tuesday:   "Tuesday",
  wednesday: "Wednesday",
  thursday:  "Thursday",
  friday:    "Friday",
  saturday:  "Saturday",
  sunday:    "Sunday",
};

const DEFAULT_SCHEDULE: Record<Day, DaySchedule> = {
  monday:    { enabled: true,  slots: [{ id: "m1", from: "09:00", to: "17:00" }] },
  tuesday:   { enabled: true,  slots: [{ id: "t1", from: "09:00", to: "17:00" }] },
  wednesday: { enabled: true,  slots: [{ id: "w1", from: "09:00", to: "17:00" }] },
  thursday:  { enabled: true,  slots: [{ id: "th1", from: "09:00", to: "17:00" }] },
  friday:    { enabled: true,  slots: [{ id: "f1", from: "09:00", to: "17:00" }] },
  saturday:  { enabled: false, slots: [{ id: "sa1", from: "10:00", to: "14:00" }] },
  sunday:    { enabled: false, slots: [] },
};

function uid() { return Math.random().toString(36).slice(2, 8); }

interface TimeSlotEditorProps {
  consultantName?: string;
  onSave?: (schedule: Record<Day, DaySchedule>) => void;
}

export function TimeSlotEditor({ consultantName = "Sarah Alderton", onSave }: TimeSlotEditorProps) {
  const [schedule, setSchedule] = useState<Record<Day, DaySchedule>>(DEFAULT_SCHEDULE);
  const [saved, setSaved]       = useState(false);

  const toggleDay = (day: Day) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }));

  const addSlot = (day: Day) =>
    setSchedule((s) => ({
      ...s,
      [day]: {
        ...s[day],
        slots: [...s[day].slots, { id: uid(), from: "09:00", to: "17:00" }],
      },
    }));

  const removeSlot = (day: Day, id: string) =>
    setSchedule((s) => ({
      ...s,
      [day]: { ...s[day], slots: s[day].slots.filter((sl) => sl.id !== id) },
    }));

  const updateSlot = (day: Day, id: string, field: "from" | "to", value: string) =>
    setSchedule((s) => ({
      ...s,
      [day]: {
        ...s[day],
        slots: s[day].slots.map((sl) => sl.id === id ? { ...sl, [field]: value } : sl),
      },
    }));

  const handleSave = () => {
    setSaved(true);
    onSave?.(schedule);
    setTimeout(() => setSaved(false), 2000);
  };

  const timeCls = "h-8 px-2 rounded-[7px] bg-[#1C1611] border border-[#3D2E1E] text-[12px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Time Slots</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">
            Availability hours for <span className="text-[#C8924A]">{consultantName}</span>
          </p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]"
          )}>
          <Save size={13} />
          {saved ? "Saved!" : "Save Schedule"}
        </button>
      </div>

      {/* Day rows */}
      <div className="divide-y divide-[#2E231A]">
        {(Object.keys(DAY_LABELS) as Day[]).map((day) => {
          const dayData = schedule[day];
          return (
            <div key={day}
              className={cn("flex items-start gap-4 px-5 py-4 transition-colors",
                !dayData.enabled && "opacity-50")}>
              {/* Toggle */}
              <button
                onClick={() => toggleDay(day)}
                className={cn(
                  "mt-1 w-10 h-6 rounded-full border relative transition-all shrink-0",
                  dayData.enabled ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#2E231A] border-[#3D2E1E]"
                )}>
                <div className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                  dayData.enabled ? "left-[18px]" : "left-0.5"
                )} />
              </button>

              {/* Day label */}
              <div className="w-24 shrink-0 pt-1">
                <p className={cn("text-[13px] font-semibold", dayData.enabled ? "text-[#E8D5B7]" : "text-[#5A4232]")}>
                  {DAY_LABELS[day]}
                </p>
              </div>

              {/* Slots */}
              <div className="flex-1 flex flex-col gap-2">
                {dayData.slots.length === 0 && dayData.enabled && (
                  <p className="text-[12px] text-[#3D2E1E] italic pt-1">No slots — click + to add</p>
                )}
                {!dayData.enabled && (
                  <p className="text-[12px] text-[#3D2E1E] italic pt-1">Unavailable</p>
                )}

                {dayData.enabled && dayData.slots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <Clock size={12} className="text-[#3D2E1E] shrink-0" />
                    <input type="time" value={slot.from}
                      onChange={(e) => updateSlot(day, slot.id, "from", e.target.value)}
                      className={timeCls} />
                    <span className="text-[12px] text-[#3D2E1E]">–</span>
                    <input type="time" value={slot.to}
                      onChange={(e) => updateSlot(day, slot.id, "to", e.target.value)}
                      className={timeCls} />
                    <button
                      onClick={() => removeSlot(day, slot.id)}
                      disabled={dayData.slots.length <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 disabled:pointer-events-none transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {dayData.enabled && (
                  <button
                    onClick={() => addSlot(day)}
                    className="flex items-center gap-1.5 text-[11.5px] text-[#5A4232] hover:text-[#C8924A] transition-colors w-fit mt-0.5">
                    <Plus size={12} /> Add slot
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}