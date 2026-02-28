"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft, Phone, Mail, MapPin, Clock,
  User, Calendar, ChevronDown, Pencil,
  MessageSquare, RefreshCcw, CheckCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { AppointmentStatus, AppointmentType } from "./AppointmentTable";

const TYPE_CONFIG: Record<AppointmentType, { label: string; bg: string; text: string }> = {
  home_visit: { label: "Home Visit", bg: "bg-[#C8924A]/15",   text: "text-[#C8924A]"  },
  showroom:   { label: "Showroom",   bg: "bg-[#6B8A9A]/15",   text: "text-[#6B8A9A]"  },
  online:     { label: "Online",     bg: "bg-emerald-400/10", text: "text-emerald-400" },
};

const STATUS_OPTIONS: AppointmentStatus[] = [
  "pending","confirmed","completed","cancelled","no_show","rescheduled",
];

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending:     "text-[#6B8A9A]",
  confirmed:   "text-blue-400",
  completed:   "text-emerald-400",
  cancelled:   "text-red-400",
  no_show:     "text-amber-400",
  rescheduled: "text-purple-400",
};

const MOCK = {
  id: "1",
  customer:    { name: "James Thornton", email: "james.t@email.com", phone: "+44 7700 900123", address: "14 Maple Street, London, SW4 7AJ" },
  type:        "home_visit" as AppointmentType,
  consultant:  { name: "Sarah Alderton", email: "s.alderton@lomashwood.co.uk", phone: "+44 7700 111222" },
  interest:    "Kitchen",
  date:        "Wednesday, 4 March 2026",
  time:        "10:00 AM",
  duration:    90,
  status:      "confirmed" as AppointmentStatus,
  location:    "14 Maple Street, London, SW4 7AJ",
  notes:       "Customer looking for a full kitchen refit — wants handleless doors, large island unit, and integrated appliances.",
  internalNotes: "",
  createdAt:   "26 Feb 2026, 14:32",
  reminders:   ["24h before (email)", "2h before (SMS)"],
};

export function AppointmentDetail() {
  const appt = MOCK;
  const [status, setStatus]         = useState<AppointmentStatus>(appt.status);
  const [showMenu, setShowMenu]     = useState(false);
  const [internalNote, setNote]     = useState(appt.internalNotes);
  const [noteSaved, setNoteSaved]   = useState(false);

  const saveNote = () => { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000); };

  const type = TYPE_CONFIG[appt.type];

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/appointments"
            className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold text-[#E8D5B7]">{appt.customer.name}</h1>
              <span className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-medium", type.bg, type.text)}>
                {type.label}
              </span>
            </div>
            <p className="text-[12px] text-[#5A4232] mt-0.5">Booked {appt.createdAt}</p>
          </div>
        </div>

        {/* Status changer */}
        <div className="flex items-center gap-2">
          <Link href={`/appointments/${appt.id}/edit`}
            className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <Pencil size={13} /> Edit
          </Link>
          <Link href={`/appointments/${appt.id}/reschedule`}
            className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <RefreshCcw size={13} /> Reschedule
          </Link>
          <div className="relative">
            <button onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
              Update Status <ChevronDown size={13} className={cn("transition-transform", showMenu && "rotate-180")} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[180px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => { setStatus(s); setShowMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] capitalize transition-all",
                      s === status ? "bg-[#C8924A]/15" : "hover:bg-[#2E231A]",
                      STATUS_COLORS[s]
                    )}>
                    {s === status && <CheckCircle size={12} />}
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: appointment info */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Date / time / location card */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-4">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: "Date",       value: appt.date                    },
                { icon: Clock,    label: "Time",       value: `${appt.time} · ${appt.duration} min` },
                { icon: User,     label: "Consultant", value: appt.consultant.name          },
                { icon: MapPin,   label: appt.type === "online" ? "Meeting" : "Location",
                  value: appt.type === "online" ? "Video call (link sent via email)" : appt.location },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#C8924A]/15 shrink-0">
                    <Icon size={14} className="text-[#C8924A]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E]">{label}</p>
                    <p className="text-[12.5px] text-[#C8B99A] mt-0.5 leading-snug">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Interest */}
            <div className="mt-4 pt-4 border-t border-[#2E231A] flex items-center gap-3">
              <span className="text-[11px] text-[#3D2E1E] uppercase tracking-wider font-semibold">Interest:</span>
              <span className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-medium",
                appt.interest === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]"
                : appt.interest === "Bedroom" ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                : "bg-purple-400/10 text-purple-400"
              )}>{appt.interest}</span>
            </div>
          </div>

          {/* Customer notes */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-3">Customer Notes</h3>
            <p className="text-[13px] text-[#7A6045] leading-relaxed italic">"{appt.notes}"</p>
          </div>

          {/* Internal notes */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-[#E8D5B7] flex items-center gap-2">
                <MessageSquare size={14} className="text-[#C8924A]" /> Internal Notes
              </h3>
              <button onClick={saveNote}
                className={cn("text-[11px] px-3 py-1 rounded-full font-medium transition-all",
                  noteSaved ? "bg-emerald-400/10 text-emerald-400" : "bg-[#C8924A]/15 text-[#C8924A] hover:bg-[#C8924A] hover:text-white")}>
                {noteSaved ? "Saved!" : "Save"}
              </button>
            </div>
            <textarea value={internalNote} onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Add private notes visible only to your team…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none" />
          </div>
        </div>

        {/* Right: customer + consultant + reminders */}
        <div className="flex flex-col gap-5">
          {/* Customer */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-4">Customer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                {appt.customer.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <Link href="/customers/1" className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">
                {appt.customer.name}
              </Link>
            </div>
            {[
              { icon: Mail,   value: appt.customer.email,   href: `mailto:${appt.customer.email}` },
              { icon: Phone,  value: appt.customer.phone,   href: `tel:${appt.customer.phone}`    },
              { icon: MapPin, value: appt.customer.address, href: undefined                       },
            ].map(({ icon: Icon, value, href }) => (
              <div key={value} className="flex items-start gap-2.5 mb-2 last:mb-0">
                <Icon size={13} className="text-[#C8924A] mt-0.5 shrink-0" />
                {href
                  ? <a href={href} className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors leading-snug">{value}</a>
                  : <span className="text-[12px] text-[#7A6045] leading-snug">{value}</span>
                }
              </div>
            ))}
          </div>

          {/* Consultant */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-4">Consultant</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B8A9A] to-[#4A6070] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                {appt.consultant.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <p className="text-[13px] font-medium text-[#C8B99A]">{appt.consultant.name}</p>
            </div>
            {[
              { icon: Mail,  value: appt.consultant.email, href: `mailto:${appt.consultant.email}` },
              { icon: Phone, value: appt.consultant.phone, href: `tel:${appt.consultant.phone}`    },
            ].map(({ icon: Icon, value, href }) => (
              <div key={value} className="flex items-center gap-2.5 mb-2 last:mb-0">
                <Icon size={13} className="text-[#6B8A9A] shrink-0" />
                <a href={href} className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors">{value}</a>
              </div>
            ))}
          </div>

          {/* Reminders */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-3">Reminders</h3>
            <div className="flex flex-col gap-2">
              {appt.reminders.map((r) => (
                <div key={r} className="flex items-center gap-2 text-[12px]">
                  <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                  <span className="text-[#7A6045]">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}