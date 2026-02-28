"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Filter, ChevronDown, MoreHorizontal,
  Eye, Pencil, XCircle, CalendarCheck, Phone, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AppointmentType   = "home_visit" | "showroom" | "online";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled";

export interface Appointment {
  id: string;
  customer: string;
  email: string;
  phone: string;
  type: AppointmentType;
  consultant: string;
  interest: "Kitchen" | "Bedroom" | "Both";
  date: string;
  time: string;
  duration: number; // minutes
  status: AppointmentStatus;
  notes?: string;
}

const MOCK: Appointment[] = [
  { id: "1", customer: "James Thornton",  email: "james.t@email.com",  phone: "+44 7700 900123", type: "home_visit", consultant: "Sarah Alderton",  interest: "Kitchen", date: "04 Mar 2026", time: "10:00", duration: 90,  status: "confirmed"   },
  { id: "2", customer: "Priya Sharma",    email: "priya.s@email.com",  phone: "+44 7700 900456", type: "showroom",   consultant: "Marcus Webb",     interest: "Bedroom", date: "04 Mar 2026", time: "14:30", duration: 60,  status: "confirmed"   },
  { id: "3", customer: "Oliver Patel",    email: "oliver.p@email.com", phone: "+44 7700 900789", type: "online",     consultant: "Sarah Alderton",  interest: "Both",    date: "05 Mar 2026", time: "09:00", duration: 45,  status: "pending"     },
  { id: "4", customer: "Emma Lawson",     email: "emma.l@email.com",   phone: "+44 7700 900321", type: "home_visit", consultant: "Jade Nguyen",     interest: "Kitchen", date: "05 Mar 2026", time: "11:30", duration: 90,  status: "rescheduled" },
  { id: "5", customer: "Daniel Huang",    email: "daniel.h@email.com", phone: "+44 7700 900654", type: "showroom",   consultant: "Marcus Webb",     interest: "Bedroom", date: "06 Mar 2026", time: "13:00", duration: 60,  status: "pending"     },
  { id: "6", customer: "Aisha Okoye",     email: "aisha.o@email.com",  phone: "+44 7700 900987", type: "online",     consultant: "Jade Nguyen",     interest: "Kitchen", date: "28 Feb 2026", time: "15:00", duration: 45,  status: "completed"   },
  { id: "7", customer: "Tom Hendricks",   email: "tom.h@email.com",    phone: "+44 7700 900111", type: "home_visit", consultant: "Sarah Alderton",  interest: "Both",    date: "26 Feb 2026", time: "10:00", duration: 120, status: "completed"   },
  { id: "8", customer: "Sarah Mitchell",  email: "sarah.m@email.com",  phone: "+44 7700 900222", type: "showroom",   consultant: "Marcus Webb",     interest: "Kitchen", date: "25 Feb 2026", time: "12:00", duration: 60,  status: "no_show"     },
];

const TYPE_CONFIG: Record<AppointmentType, { label: string; bg: string; text: string }> = {
  home_visit: { label: "Home Visit", bg: "bg-[#C8924A]/15",    text: "text-[#C8924A]"  },
  showroom:   { label: "Showroom",   bg: "bg-[#6B8A9A]/15",    text: "text-[#6B8A9A]"  },
  online:     { label: "Online",     bg: "bg-emerald-400/10",  text: "text-emerald-400" },
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:     { label: "Pending",     bg: "bg-[#6B8A9A]/15",    text: "text-[#6B8A9A]",  dot: "bg-[#6B8A9A]"  },
  confirmed:   { label: "Confirmed",   bg: "bg-blue-400/10",     text: "text-blue-400",    dot: "bg-blue-400"   },
  completed:   { label: "Completed",   bg: "bg-emerald-400/10",  text: "text-emerald-400", dot: "bg-emerald-400"},
  cancelled:   { label: "Cancelled",   bg: "bg-red-400/10",      text: "text-red-400",     dot: "bg-red-400"    },
  no_show:     { label: "No Show",     bg: "bg-amber-400/10",    text: "text-amber-400",   dot: "bg-amber-400"  },
  rescheduled: { label: "Rescheduled", bg: "bg-purple-400/10",   text: "text-purple-400",  dot: "bg-purple-400" },
};

export function AppointmentTable() {
  const [search, setSearch]         = useState("");
  const [typeFilter, setType]       = useState<"All" | AppointmentType>("All");
  const [statusFilter, setStatus]   = useState<"All" | AppointmentStatus>("All");
  const [openMenu, setOpenMenu]     = useState<string | null>(null);
  const [selected, setSelected]     = useState<string[]>([]);

  const filtered = MOCK.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.customer.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.consultant.toLowerCase().includes(q);
    return (
      matchSearch &&
      (typeFilter   === "All" || a.type   === typeFilter) &&
      (statusFilter === "All" || a.status === statusFilter)
    );
  });

  const toggleSelect = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((a) => a.id));

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, consultant…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[220px]"
          />
        </div>

        {/* Type */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select value={typeFilter} onChange={(e) => setType(e.target.value as any)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Types</option>
            <option value="home_visit" className="bg-[#1C1611]">Home Visit</option>
            <option value="showroom"   className="bg-[#1C1611]">Showroom</option>
            <option value="online"     className="bg-[#1C1611]">Online</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Status</option>
            {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((s) => (
              <option key={s} value={s} className="bg-[#1C1611]">{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {selected.length > 0 && (
          <span className="text-[11px] text-[#C8924A] bg-[#C8924A]/10 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
        )}

        <Link href="/appointments/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <CalendarCheck size={14} /> New Appointment
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              <th className="px-5 py-3 w-10">
                <input type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
              </th>
              {["Customer","Type","Consultant","Interest","Date & Time","Duration","Status",""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((appt) => {
              const type   = TYPE_CONFIG[appt.type];
              const status = STATUS_CONFIG[appt.status];
              return (
                <tr key={appt.id} className="group hover:bg-[#221A12] transition-colors">
                  <td className="px-5 py-3.5">
                    <input type="checkbox" checked={selected.includes(appt.id)}
                      onChange={() => toggleSelect(appt.id)}
                      className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-3.5">
                    <Link href={`/appointments/${appt.id}`}>
                      <p className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">{appt.customer}</p>
                    </Link>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[10.5px] text-[#5A4232]">
                        <Mail size={9} /> {appt.email}
                      </span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3.5">
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", type.bg, type.text)}>
                      {type.label}
                    </span>
                  </td>

                  {/* Consultant */}
                  <td className="px-3 py-3.5">
                    <span className="text-[12.5px] text-[#7A6045]">{appt.consultant}</span>
                  </td>

                  {/* Interest */}
                  <td className="px-3 py-3.5">
                    <span className={cn(
                      "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                      appt.interest === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]"
                      : appt.interest === "Bedroom" ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                      : "bg-purple-400/10 text-purple-400"
                    )}>{appt.interest}</span>
                  </td>

                  {/* Date & Time */}
                  <td className="px-3 py-3.5">
                    <p className="text-[12.5px] font-medium text-[#C8B99A]">{appt.date}</p>
                    <p className="text-[11px] text-[#5A4232]">{appt.time}</p>
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-3.5">
                    <span className="text-[12px] text-[#5A4232]">{appt.duration} min</span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", status.bg, status.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dot)} />
                      {status.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3.5 relative">
                    <button onClick={() => setOpenMenu(openMenu === appt.id ? null : appt.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === appt.id && (
                      <div className="absolute right-3 top-full mt-1 z-20 w-[160px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                        {[
                          { icon: Eye,    label: "View",       href: `/appointments/${appt.id}` },
                          { icon: Pencil, label: "Edit",       href: `/appointments/${appt.id}/edit` },
                          { icon: Phone,  label: "Call",       href: `tel:${appt.phone}` },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link key={label} href={href} onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                            <Icon size={13} /> {label}
                          </Link>
                        ))}
                        <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-red-400 hover:bg-red-400/10 transition-all border-t border-[#2E231A]">
                          <XCircle size={13} /> Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A] flex items-center justify-between">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} appointments</span>
        <span className="text-[12px] text-[#3D2E1E]">Page 1 of 1</span>
      </div>
    </div>
  );
}