"use client";

import { useState } from "react";

import Link from "next/link";

import { Plus, Pencil, Trash2, Bell, Mail, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

type Channel  = "email" | "sms" | "both";
type Trigger  = "before" | "after";

interface Reminder {
  id: string;
  name: string;
  channel: Channel;
  trigger: Trigger;
  offsetValue: number;
  offsetUnit: "minutes" | "hours" | "days";
  appliesToType: "all" | "home_visit" | "showroom" | "online";
  isActive: boolean;
  sentCount: number;
}

const MOCK_REMINDERS: Reminder[] = [
  { id: "1", name: "24h Before — Email",   channel: "email", trigger: "before", offsetValue: 24, offsetUnit: "hours",   appliesToType: "all",       isActive: true,  sentCount: 312 },
  { id: "2", name: "2h Before — SMS",      channel: "sms",   trigger: "before", offsetValue: 2,  offsetUnit: "hours",   appliesToType: "all",       isActive: true,  sentCount: 298 },
  { id: "3", name: "15min Before — Email", channel: "email", trigger: "before", offsetValue: 15, offsetUnit: "minutes", appliesToType: "online",    isActive: true,  sentCount: 84  },
  { id: "4", name: "1 Day Before — Both",  channel: "both",  trigger: "before", offsetValue: 1,  offsetUnit: "days",    appliesToType: "home_visit",isActive: false, sentCount: 0   },
  { id: "5", name: "Follow-up — 1 Day After", channel: "email", trigger: "after", offsetValue: 1, offsetUnit: "days",  appliesToType: "all",       isActive: true,  sentCount: 156 },
];

const CHANNEL_CONFIG: Record<Channel, { icon: React.ElementType; label: string; cls: string }> = {
  email: { icon: Mail,          label: "Email",     cls: "bg-[#6B8A9A]/15 text-[#6B8A9A]"  },
  sms:   { icon: MessageSquare, label: "SMS",       cls: "bg-[#C8924A]/15 text-[#C8924A]"  },
  both:  { icon: Bell,          label: "Email + SMS", cls: "bg-purple-400/10 text-purple-400" },
};

const TYPE_LABELS: Record<string, string> = {
  all:        "All Types",
  home_visit: "Home Visit",
  showroom:   "Showroom",
  online:     "Online",
};

export function ReminderTable() {
  const [reminders, setReminders] = useState<Reminder[]>(MOCK_REMINDERS);

  const toggleActive = (id: string) =>
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7] flex items-center gap-2">
            <Bell size={15} className="text-[#C8924A]" /> Reminder Rules
          </h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Automated appointment reminders sent to customers</p>
        </div>
        <Link href="/appointments/reminders/new"
          className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={14} /> Add Reminder
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Name","Channel","When","Applies To","Sent","Active",""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {reminders.map((r) => {
              const ch = CHANNEL_CONFIG[r.channel];
              const Icon = ch.icon;
              return (
                <tr key={r.id} className="group hover:bg-[#221A12] transition-colors">
                  {/* Name */}
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-medium text-[#C8B99A]">{r.name}</p>
                  </td>

                  {/* Channel */}
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", ch.cls)}>
                      <Icon size={10} /> {ch.label}
                    </span>
                  </td>

                  {/* When */}
                  <td className="px-5 py-3.5">
                    <span className="text-[12.5px] text-[#7A6045]">
                      {r.offsetValue} {r.offsetUnit} {r.trigger}
                    </span>
                  </td>

                  {/* Applies to */}
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-[#5A4232]">{TYPE_LABELS[r.appliesToType]}</span>
                  </td>

                  {/* Sent */}
                  <td className="px-5 py-3.5">
                    <span className="text-[12.5px] font-semibold text-[#E8D5B7]">{r.sentCount.toLocaleString()}</span>
                  </td>

                  {/* Active toggle */}
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActive(r.id)}
                      className={cn(
                        "w-10 h-6 rounded-full border relative transition-all",
                        r.isActive ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#2E231A] border-[#3D2E1E]"
                      )}>
                      <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                        r.isActive ? "left-[18px]" : "left-0.5")} />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/appointments/reminders/${r.id}`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                        <Pencil size={13} />
                      </Link>
                      <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{reminders.filter((r) => r.isActive).length} active · {reminders.length} total</span>
      </div>
    </div>
  );
}