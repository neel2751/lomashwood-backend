"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Filter, ChevronDown, Plus,
  Eye, AlertTriangle, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TicketStatus   = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "delivery" | "quality" | "installation" | "billing" | "general" | "complaint";

export interface SupportTicket {
  id: string;
  ticketNo: string;
  customer: string;
  customerId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string;
  messages: number;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
}

const MOCK_TICKETS: SupportTicket[] = [
  { id: "1", ticketNo: "TKT-0091", customer: "Sarah Mitchell",  customerId: "8", subject: "Scratched doors on delivery",           category: "delivery",      priority: "high",   status: "in_progress", assignee: "Support Team", messages: 4, createdAt: "28 Feb 2026", updatedAt: "28 Feb 2026", dueAt: "03 Mar 2026" },
  { id: "2", ticketNo: "TKT-0090", customer: "Tom Hendricks",   customerId: "7", subject: "Door hinge adjustment needed",           category: "installation",  priority: "medium", status: "waiting",     assignee: "Install Team", messages: 2, createdAt: "27 Feb 2026", updatedAt: "28 Feb 2026", dueAt: "05 Mar 2026" },
  { id: "3", ticketNo: "TKT-0089", customer: "Aisha Okoye",     customerId: "6", subject: "Invoice discrepancy — overcharged",      category: "billing",       priority: "urgent", status: "open",        assignee: "Unassigned",   messages: 1, createdAt: "26 Feb 2026", updatedAt: "26 Feb 2026", dueAt: "28 Feb 2026" },
  { id: "4", ticketNo: "TKT-0088", customer: "Daniel Huang",    customerId: "5", subject: "Query on delivery timescale",            category: "delivery",      priority: "low",    status: "resolved",    assignee: "Support Team", messages: 5, createdAt: "24 Feb 2026", updatedAt: "26 Feb 2026" },
  { id: "5", ticketNo: "TKT-0087", customer: "Emma Lawson",     customerId: "4", subject: "Poor installation — gaps in carcass",    category: "complaint",     priority: "high",   status: "open",        assignee: "Unassigned",   messages: 1, createdAt: "23 Feb 2026", updatedAt: "23 Feb 2026", dueAt: "27 Feb 2026" },
  { id: "6", ticketNo: "TKT-0086", customer: "Priya Sharma",    customerId: "2", subject: "General inquiry — brochure request",     category: "general",       priority: "low",    status: "closed",      assignee: "Support Team", messages: 3, createdAt: "20 Feb 2026", updatedAt: "22 Feb 2026" },
  { id: "7", ticketNo: "TKT-0085", customer: "Oliver Patel",    customerId: "3", subject: "Bedroom unit colour mismatch",           category: "quality",       priority: "high",   status: "in_progress", assignee: "Quality Team", messages: 6, createdAt: "18 Feb 2026", updatedAt: "27 Feb 2026", dueAt: "02 Mar 2026" },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string; dot: string }> = {
  open:        { label: "Open",        bg: "bg-red-400/10",      text: "text-red-400",     dot: "bg-red-400"     },
  in_progress: { label: "In Progress", bg: "bg-blue-400/10",     text: "text-blue-400",    dot: "bg-blue-400"    },
  waiting:     { label: "Waiting",     bg: "bg-[#C8924A]/15",    text: "text-[#C8924A]",   dot: "bg-[#C8924A]"   },
  resolved:    { label: "Resolved",    bg: "bg-emerald-400/10",  text: "text-emerald-400", dot: "bg-emerald-400" },
  closed:      { label: "Closed",      bg: "bg-[#3D2E1E]",       text: "text-[#5A4232]",   dot: "bg-[#5A4232]"   },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-[#3D2E1E] text-[#5A4232]"        },
  medium: { label: "Medium", cls: "bg-[#6B8A9A]/15 text-[#6B8A9A]"     },
  high:   { label: "High",   cls: "bg-[#C8924A]/15 text-[#C8924A]"     },
  urgent: { label: "Urgent", cls: "bg-red-400/10 text-red-400"         },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  delivery:     "Delivery",
  quality:      "Quality",
  installation: "Installation",
  billing:      "Billing",
  general:      "General",
  complaint:    "Complaint",
};

function isOverdue(dueAt?: string) {
  if (!dueAt) return false;
  const parts = dueAt.split(" ");
  if (parts.length < 3) return false;
  return new Date(dueAt) < new Date();
}

export function SupportTicketTable() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<"All" | TicketStatus>("All");
  const [priorityFilter, setPriority] = useState<"All" | TicketPriority>("All");

  const filtered = MOCK_TICKETS.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.ticketNo.toLowerCase().includes(q) ||
      t.customer.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q);
    return (
      matchSearch &&
      (statusFilter   === "All" || t.status   === statusFilter) &&
      (priorityFilter === "All" || t.priority === priorityFilter)
    );
  });

  const urgentCount  = MOCK_TICKETS.filter((t) => t.priority === "urgent" && t.status !== "closed" && t.status !== "resolved").length;
  const overdueCount = MOCK_TICKETS.filter((t) => isOverdue(t.dueAt) && t.status !== "closed" && t.status !== "resolved").length;

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Alert strip */}
      {(urgentCount > 0 || overdueCount > 0) && (
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-red-400/20 bg-red-400/10">
          <AlertTriangle size={13} className="text-red-400 shrink-0" />
          <div className="flex items-center gap-3 text-[12px] text-red-400">
            {urgentCount > 0 && <span>{urgentCount} urgent ticket{urgentCount !== 1 ? "s" : ""}</span>}
            {overdueCount > 0 && <span>{overdueCount} overdue</span>}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, customers…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[220px]" />
        </div>

        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Status</option>
            {(Object.keys(STATUS_CONFIG) as TicketStatus[]).map((s) => (
              <option key={s} value={s} className="bg-[#1C1611]">{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <div className="relative">
          <select value={priorityFilter} onChange={(e) => setPriority(e.target.value as any)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Priority</option>
            {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map((p) => (
              <option key={p} value={p} className="bg-[#1C1611]">{PRIORITY_CONFIG[p].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <Link href="/customers/support/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={14} /> New Ticket
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Ticket","Customer","Subject","Category","Priority","Status","Assignee","Due","Msgs",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((ticket) => {
              const st   = STATUS_CONFIG[ticket.status];
              const pr   = PRIORITY_CONFIG[ticket.priority];
              const over = isOverdue(ticket.dueAt) && ticket.status !== "closed" && ticket.status !== "resolved";

              return (
                <tr key={ticket.id} className="group hover:bg-[#221A12] transition-colors">
                  {/* Ticket no */}
                  <td className="px-4 py-3.5">
                    <Link href={`/customers/support/${ticket.id}`}
                      className="text-[12.5px] font-mono font-semibold text-[#C8924A] hover:text-[#E8D5B7] transition-colors">
                      {ticket.ticketNo}
                    </Link>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3.5">
                    <Link href={`/customers/${ticket.customerId}`}
                      className="text-[12.5px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">
                      {ticket.customer}
                    </Link>
                  </td>

                  {/* Subject */}
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <Link href={`/customers/support/${ticket.id}`}
                      className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors line-clamp-2 leading-snug">
                      {ticket.subject}
                    </Link>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] text-[#5A4232]">{CATEGORY_LABELS[ticket.category]}</span>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5">
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", pr.cls)}>
                      {pr.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", st.bg, st.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                      {st.label}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3.5">
                    <span className={cn("text-[11.5px]", ticket.assignee === "Unassigned" ? "text-[#3D2E1E] italic" : "text-[#5A4232]")}>
                      {ticket.assignee}
                    </span>
                  </td>

                  {/* Due date */}
                  <td className="px-4 py-3.5">
                    {ticket.dueAt
                      ? <span className={cn("flex items-center gap-1 text-[11px] whitespace-nowrap", over ? "text-red-400 font-medium" : "text-[#5A4232]")}>
                          {over && <Clock size={10} />}
                          {ticket.dueAt}
                        </span>
                      : <span className="text-[11px] text-[#3D2E1E]">—</span>
                    }
                  </td>

                  {/* Messages */}
                  <td className="px-4 py-3.5">
                    <span className="text-[12px] text-[#7A6045]">{ticket.messages}</span>
                  </td>

                  {/* View */}
                  <td className="px-4 py-3.5">
                    <Link href={`/customers/support/${ticket.id}`}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                      <Eye size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A] flex items-center justify-between">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} tickets</span>
        <span className="text-[12px] text-[#3D2E1E]">
          {MOCK_TICKETS.filter((t) => t.status === "open" || t.status === "in_progress").length} active
        </span>
      </div>
    </div>
  );
}