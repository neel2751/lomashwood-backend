"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Search, Filter, ChevronDown, MoreHorizontal,
  Eye, Mail, Phone, Star, UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";

type CustomerStatus = "active" | "inactive" | "vip" | "blocked";
type CustomerInterest = "Kitchen" | "Bedroom" | "Both";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: CustomerInterest;
  status: CustomerStatus;
  totalSpend: number;
  ordersCount: number;
  appointmentsCount: number;
  loyaltyPoints: number;
  joinedAt: string;
  lastActivity: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", name: "James Thornton",  email: "james.t@email.com",  phone: "+44 7700 900123", interest: "Kitchen", status: "vip",      totalSpend: 18400, ordersCount: 2, appointmentsCount: 3, loyaltyPoints: 920,  joinedAt: "Jan 2025",  lastActivity: "28 Feb 2026" },
  { id: "2", name: "Priya Sharma",    email: "priya.s@email.com",  phone: "+44 7700 900456", interest: "Both",    status: "active",   totalSpend: 9100,  ordersCount: 1, appointmentsCount: 2, loyaltyPoints: 455,  joinedAt: "Mar 2025",  lastActivity: "25 Feb 2026" },
  { id: "3", name: "Oliver Patel",    email: "oliver.p@email.com", phone: "+44 7700 900789", interest: "Bedroom", status: "active",   totalSpend: 14600, ordersCount: 1, appointmentsCount: 1, loyaltyPoints: 730,  joinedAt: "Apr 2025",  lastActivity: "27 Feb 2026" },
  { id: "4", name: "Emma Lawson",     email: "emma.l@email.com",   phone: "+44 7700 900321", interest: "Kitchen", status: "inactive", totalSpend: 6800,  ordersCount: 1, appointmentsCount: 1, loyaltyPoints: 340,  joinedAt: "Jun 2025",  lastActivity: "10 Jan 2026" },
  { id: "5", name: "Daniel Huang",    email: "daniel.h@email.com", phone: "+44 7700 900654", interest: "Bedroom", status: "active",   totalSpend: 2900,  ordersCount: 1, appointmentsCount: 1, loyaltyPoints: 145,  joinedAt: "Aug 2025",  lastActivity: "26 Feb 2026" },
  { id: "6", name: "Aisha Okoye",     email: "aisha.o@email.com",  phone: "+44 7700 900987", interest: "Kitchen", status: "vip",      totalSpend: 22100, ordersCount: 3, appointmentsCount: 4, loyaltyPoints: 1105, joinedAt: "Oct 2024",  lastActivity: "28 Feb 2026" },
  { id: "7", name: "Tom Hendricks",   email: "tom.h@email.com",    phone: "+44 7700 900111", interest: "Both",    status: "active",   totalSpend: 17200, ordersCount: 2, appointmentsCount: 2, loyaltyPoints: 860,  joinedAt: "Nov 2024",  lastActivity: "24 Feb 2026" },
  { id: "8", name: "Sarah Mitchell",  email: "sarah.m@email.com",  phone: "+44 7700 900222", interest: "Bedroom", status: "blocked",  totalSpend: 3200,  ordersCount: 1, appointmentsCount: 1, loyaltyPoints: 0,    joinedAt: "Dec 2024",  lastActivity: "05 Feb 2026" },
];

const STATUS_CONFIG: Record<CustomerStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:   { label: "Active",   bg: "bg-emerald-400/10",  text: "text-emerald-400", dot: "bg-emerald-400" },
  inactive: { label: "Inactive", bg: "bg-[#3D2E1E]",       text: "text-[#5A4232]",   dot: "bg-[#5A4232]"  },
  vip:      { label: "VIP",      bg: "bg-[#C8924A]/15",    text: "text-[#C8924A]",   dot: "bg-[#C8924A]"  },
  blocked:  { label: "Blocked",  bg: "bg-red-400/10",      text: "text-red-400",     dot: "bg-red-400"    },
};

function Avatar({ name, status }: { name: string; status: CustomerStatus }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div className="relative shrink-0">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8924A] to-[#6B4A20] flex items-center justify-center text-white text-[12px] font-bold">
        {initials}
      </div>
      {status === "vip" && (
        <Star size={10} className="absolute -top-0.5 -right-0.5 text-[#C8924A] fill-[#C8924A]" />
      )}
      {status === "active" && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1C1611]" />
      )}
    </div>
  );
}

export function CustomerTable() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<"All" | CustomerStatus>("All");
  const [interestFilter, setInterest] = useState<"All" | CustomerInterest>("All");
  const [openMenu, setOpenMenu]     = useState<string | null>(null);
  const [selected, setSelected]     = useState<string[]>([]);

  const filtered = MOCK_CUSTOMERS.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q);
    return (
      matchSearch &&
      (statusFilter   === "All" || c.status   === statusFilter) &&
      (interestFilter === "All" || c.interest === interestFilter)
    );
  });

  const toggleSelect = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[220px]" />
        </div>

        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Status</option>
            {(Object.keys(STATUS_CONFIG) as CustomerStatus[]).map((s) => (
              <option key={s} value={s} className="bg-[#1C1611]">{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <div className="flex gap-1 bg-[#2E231A] rounded-[8px] p-0.5">
          {(["All", "Kitchen", "Bedroom", "Both"] as const).map((i) => (
            <button key={i} onClick={() => setInterest(i)}
              className={cn("px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all",
                interestFilter === i ? "bg-[#C8924A] text-white" : "text-[#5A4232] hover:text-[#C8924A]")}>
              {i}
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <span className="text-[11px] text-[#C8924A] bg-[#C8924A]/10 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
        )}

        <Link href="/customers/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <UserPlus size={14} /> Add Customer
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              <th className="px-5 py-3 w-10">
                <input type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
              </th>
              {["Customer","Interest","Total Spend","Orders","Appts","Loyalty Pts","Status","Last Active",""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((c) => {
              const st = STATUS_CONFIG[c.status];
              return (
                <tr key={c.id} className="group hover:bg-[#221A12] transition-colors">
                  <td className="px-5 py-3.5">
                    <input type="checkbox" checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} status={c.status} />
                      <div>
                        <Link href={`/customers/${c.id}`}
                          className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors block">
                          {c.name}
                        </Link>
                        <p className="text-[11px] text-[#5A4232]">{c.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Interest */}
                  <td className="px-3 py-3.5">
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                      c.interest === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]"
                      : c.interest === "Bedroom" ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                      : "bg-purple-400/10 text-purple-400")}>
                      {c.interest}
                    </span>
                  </td>

                  {/* Spend */}
                  <td className="px-3 py-3.5">
                    <span className="text-[13px] font-semibold text-[#E8D5B7]">
                      £{c.totalSpend.toLocaleString()}
                    </span>
                  </td>

                  {/* Orders */}
                  <td className="px-3 py-3.5">
                    <span className="text-[12.5px] text-[#7A6045]">{c.ordersCount}</span>
                  </td>

                  {/* Appointments */}
                  <td className="px-3 py-3.5">
                    <span className="text-[12.5px] text-[#7A6045]">{c.appointmentsCount}</span>
                  </td>

                  {/* Loyalty */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Star size={11} className="text-[#C8924A]" />
                      <span className="text-[12.5px] font-medium text-[#C8B99A]">{c.loyaltyPoints.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", st.bg, st.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                      {st.label}
                    </span>
                  </td>

                  {/* Last active */}
                  <td className="px-3 py-3.5">
                    <span className="text-[11px] text-[#5A4232]">{c.lastActivity}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3.5 relative">
                    <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-3 top-full mt-1 z-20 w-[155px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                        {[
                          { icon: Eye,  label: "View Profile", href: `/customers/${c.id}` },
                          { icon: Mail, label: "Send Email",   href: `mailto:${c.email}` },
                          { icon: Phone,label: "Call",         href: `tel:${c.phone}`    },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link key={label} href={href} onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                            <Icon size={13} /> {label}
                          </Link>
                        ))}
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
        <span className="text-[12px] text-[#5A4232]">{filtered.length} customers</span>
        <span className="text-[12px] text-[#3D2E1E]">Page 1 of 1</span>
      </div>
    </div>
  );
}