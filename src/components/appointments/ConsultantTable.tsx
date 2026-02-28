"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type ConsultantStatus = "active" | "inactive" | "on_leave";

interface Consultant {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialisation: ("Kitchen" | "Bedroom" | "Both")[];
  types: ("home_visit" | "showroom" | "online")[];
  status: ConsultantStatus;
  appointmentsThisMonth: number;
  completedTotal: number;
  rating: number;
  joinedAt: string;
}

const MOCK_CONSULTANTS: Consultant[] = [
  { id: "1", name: "Sarah Alderton",  email: "s.alderton@lomashwood.co.uk",  phone: "+44 7700 111222", specialisation: ["Kitchen","Bedroom"], types: ["home_visit","showroom","online"], status: "active",   appointmentsThisMonth: 18, completedTotal: 234, rating: 4.9, joinedAt: "Jan 2024" },
  { id: "2", name: "Marcus Webb",     email: "m.webb@lomashwood.co.uk",      phone: "+44 7700 333444", specialisation: ["Kitchen"],           types: ["showroom","online"],             status: "active",   appointmentsThisMonth: 14, completedTotal: 187, rating: 4.7, joinedAt: "Mar 2024" },
  { id: "3", name: "Jade Nguyen",     email: "j.nguyen@lomashwood.co.uk",    phone: "+44 7700 555666", specialisation: ["Bedroom"],           types: ["home_visit","online"],           status: "on_leave", appointmentsThisMonth: 0,  completedTotal: 98,  rating: 4.8, joinedAt: "Aug 2024" },
  { id: "4", name: "Callum Briggs",   email: "c.briggs@lomashwood.co.uk",    phone: "+44 7700 777888", specialisation: ["Both"],              types: ["home_visit","showroom"],         status: "inactive", appointmentsThisMonth: 0,  completedTotal: 45,  rating: 4.5, joinedAt: "Nov 2024" },
];

const STATUS_STYLES: Record<ConsultantStatus, string> = {
  active:   "bg-emerald-400/10 text-emerald-400",
  inactive: "bg-[#3D2E1E] text-[#5A4232]",
  on_leave: "bg-amber-400/10 text-amber-400",
};

const STATUS_LABELS: Record<ConsultantStatus, string> = {
  active:   "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
};

const TYPE_LABELS: Record<string, string> = {
  home_visit: "Home Visit",
  showroom:   "Showroom",
  online:     "Online",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[#C8924A] text-[13px]">★</span>
      <span className="text-[12px] font-semibold text-[#E8D5B7]">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ConsultantTable() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<"All" | ConsultantStatus>("All");

  const filtered = MOCK_CONSULTANTS.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === "All" || c.status === statusFilter);
  });

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search consultants…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]" />
        </div>
        <div className="flex gap-1 bg-[#2E231A] rounded-[8px] p-0.5">
          {(["All","active","on_leave","inactive"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("px-3 py-1 rounded-[6px] text-[11px] font-medium capitalize transition-all",
                statusFilter === s ? "bg-[#C8924A] text-white" : "text-[#5A4232] hover:text-[#C8924A]")}>
              {s === "All" ? "All" : STATUS_LABELS[s as ConsultantStatus]}
            </button>
          ))}
        </div>
        <Link href="/appointments/consultants/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={14} /> Add Consultant
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Consultant","Specialisation","Types","Status","This Month","Total","Rating","Joined",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((c) => (
              <tr key={c.id} className="group hover:bg-[#221A12] transition-colors">
                {/* Name */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <Link href={`/appointments/consultants/${c.id}`}
                        className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors block">{c.name}</Link>
                      <p className="text-[11px] text-[#5A4232]">{c.email}</p>
                    </div>
                  </div>
                </td>

                {/* Specialisation */}
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {c.specialisation.map((s) => (
                      <span key={s} className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        s === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]"
                        : s === "Bedroom" ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                        : "bg-purple-400/10 text-purple-400")}>
                        {s}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Types */}
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    {c.types.map((t) => (
                      <span key={t} className="text-[11px] text-[#5A4232]">{TYPE_LABELS[t]}</span>
                    ))}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[c.status])}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>

                {/* This month */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#5A4232]" />
                    <span className="text-[13px] font-semibold text-[#E8D5B7]">{c.appointmentsThisMonth}</span>
                  </div>
                </td>

                {/* Total */}
                <td className="px-4 py-4">
                  <span className="text-[12.5px] text-[#7A6045]">{c.completedTotal}</span>
                </td>

                {/* Rating */}
                <td className="px-4 py-4">
                  <Stars rating={c.rating} />
                </td>

                {/* Joined */}
                <td className="px-4 py-4">
                  <span className="text-[11px] text-[#5A4232]">{c.joinedAt}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/appointments/consultants/${c.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                      <Pencil size={13} />
                    </Link>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} consultants</span>
      </div>
    </div>
  );
}