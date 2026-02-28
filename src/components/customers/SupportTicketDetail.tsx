"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft, Send, CheckCircle, AlertTriangle,
  ChevronDown, User, Headphones, Paperclip, Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { TicketStatus, TicketPriority, TicketCategory } from "./SupportTicketTable";

interface Message {
  id: string;
  author: string;
  role: "customer" | "agent";
  body: string;
  timestamp: string;
  attachments?: string[];
}

const MOCK_TICKET = {
  id: "1",
  ticketNo:  "TKT-0091",
  subject:   "Scratched doors on delivery",
  category:  "delivery" as TicketCategory,
  priority:  "high" as TicketPriority,
  status:    "in_progress" as TicketStatus,
  assignee:  "Support Team",
  createdAt: "28 Feb 2026, 10:15",
  updatedAt: "28 Feb 2026, 14:30",
  dueAt:     "03 Mar 2026",
  customer:  { name: "Sarah Mitchell", email: "sarah.m@email.com", id: "8" },
  messages:  [
    { id: "m1", author: "Sarah Mitchell", role: "customer" as const, body: "Hi, I received my order (#1047) today but two of the kitchen door panels arrived with scratches. This is really disappointing. I've been waiting weeks for this delivery. Please can someone contact me urgently to resolve this.", timestamp: "28 Feb 2026, 10:15" },
    { id: "m2", author: "Support Team",   role: "agent" as const,   body: "Hi Sarah, thank you for contacting us and we're very sorry to hear about the damage to your delivery. We completely understand how upsetting this is. I've escalated this to our quality team and we'll arrange for replacement panels to be dispatched within 48 hours. Could you please send us photos of the damage to help us document this?", timestamp: "28 Feb 2026, 14:30" },
  ] as Message[],
};

const STATUS_OPTIONS: TicketStatus[]   = ["open","in_progress","waiting","resolved","closed"];
const PRIORITY_OPTIONS: TicketPriority[] = ["low","medium","high","urgent"];
const ASSIGNEES = ["Support Team", "Quality Team", "Install Team", "Management", "Unassigned"];

const STATUS_CONFIG: Record<TicketStatus, { label: string; cls: string }> = {
  open:        { label: "Open",        cls: "text-red-400"     },
  in_progress: { label: "In Progress", cls: "text-blue-400"    },
  waiting:     { label: "Waiting",     cls: "text-[#C8924A]"   },
  resolved:    { label: "Resolved",    cls: "text-emerald-400" },
  closed:      { label: "Closed",      cls: "text-[#5A4232]"   },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-[#3D2E1E] text-[#5A4232]"    },
  medium: { label: "Medium", cls: "bg-[#6B8A9A]/15 text-[#6B8A9A]" },
  high:   { label: "High",   cls: "bg-[#C8924A]/15 text-[#C8924A]" },
  urgent: { label: "Urgent", cls: "bg-red-400/10 text-red-400"     },
};

const CANNED_RESPONSES = [
  "Thank you for contacting us. We're looking into this and will respond within 24 hours.",
  "We're sorry to hear about this issue. Could you please provide more details or photos?",
  "Your case has been escalated to our specialist team. We'll be in touch shortly.",
  "We're pleased to confirm this has been resolved. Please don't hesitate to contact us if you need anything else.",
];

export function SupportTicketDetail() {
  const [ticket, setTicket] = useState(MOCK_TICKET);
  const [reply, setReply]   = useState("");
  const [sending, setSending] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [assignee, setAssignee] = useState(ticket.assignee);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setTicket((t) => ({
      ...t,
      messages: [...t.messages, {
        id: `m${Date.now()}`,
        author: "Support Team",
        role: "agent",
        body: reply,
        timestamp: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      }],
    }));
    setReply("");
    setSending(false);
  };

  const pr = PRIORITY_CONFIG[priority];
  const st = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/customers/support"
            className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[16px] font-bold text-[#E8D5B7]">{ticket.subject}</h1>
              <span className="text-[12px] font-mono text-[#C8924A]">{ticket.ticketNo}</span>
              <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", pr.cls)}>
                {pr.label}
              </span>
            </div>
            <p className="text-[11.5px] text-[#5A4232] mt-0.5">
              Opened {ticket.createdAt} · Last update {ticket.updatedAt}
            </p>
          </div>
        </div>

        {/* Status changer */}
        <div className="relative">
          <button onClick={() => setShowStatusMenu((v) => !v)}
            className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
            Update Status <ChevronDown size={13} className={cn("transition-transform", showStatusMenu && "rotate-180")} />
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[175px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => { setStatus(s); setShowStatusMenu(false); }}
                  className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] transition-all",
                    s === status ? "bg-[#C8924A]/15" : "hover:bg-[#2E231A]",
                    STATUS_CONFIG[s].cls)}>
                  {s === status && <CheckCircle size={12} />}
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: conversation */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Messages */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2E231A]">
              <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Conversation</h3>
            </div>
            <div className="flex flex-col gap-0 divide-y divide-[#2E231A]">
              {ticket.messages.map((msg) => {
                const isAgent = msg.role === "agent";
                return (
                  <div key={msg.id} className={cn("p-5", isAgent && "bg-[#1A100C]")}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold",
                        isAgent
                          ? "bg-gradient-to-br from-[#6B8A9A] to-[#4A6070]"
                          : "bg-gradient-to-br from-[#C8924A] to-[#6B4A20]"
                      )}>
                        {isAgent ? <Headphones size={14} /> : msg.author.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-[12.5px] font-medium text-[#E8D5B7]">{msg.author}</p>
                        <p className="text-[10.5px] text-[#3D2E1E]">{msg.timestamp}</p>
                      </div>
                      {isAgent && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#6B8A9A]/15 text-[#6B8A9A] font-medium">
                          Agent
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#7A6045] leading-relaxed pl-[42px]">{msg.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reply box */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[#E8D5B7]">Reply</h3>
              <button onClick={() => setShowCanned((v) => !v)}
                className="text-[11.5px] text-[#5A4232] hover:text-[#C8924A] transition-colors flex items-center gap-1">
                Canned responses <ChevronDown size={11} className={cn("transition-transform", showCanned && "rotate-180")} />
              </button>
            </div>

            {showCanned && (
              <div className="rounded-[8px] border border-[#3D2E1E] divide-y divide-[#3D2E1E] overflow-hidden">
                {CANNED_RESPONSES.map((cr, i) => (
                  <button key={i} onClick={() => { setReply(cr); setShowCanned(false); }}
                    className="w-full text-left px-3 py-2 text-[11.5px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all line-clamp-2">
                    {cr}
                  </button>
                ))}
              </div>
            )}

            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4}
              placeholder="Type your reply…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none" />

            <div className="flex items-center gap-2">
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] disabled:opacity-50 disabled:pointer-events-none transition-all">
                <Send size={13} />
                {sending ? "Sending…" : "Send Reply"}
              </button>
              <button className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
                <Paperclip size={13} /> Attach
              </button>
              <button onClick={() => { setStatus("resolved"); }}
                className="ml-auto flex items-center gap-2 h-9 px-3 rounded-[9px] bg-emerald-400/10 text-emerald-400 text-[12px] font-medium hover:bg-emerald-400/20 transition-all">
                <CheckCircle size={13} /> Mark Resolved
              </button>
            </div>
          </div>
        </div>

        {/* Right: ticket meta */}
        <div className="flex flex-col gap-5">
          {/* Details */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-4">Ticket Details</h3>
            <div className="flex flex-col gap-3">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Status</label>
                <p className={cn("text-[13px] font-semibold", st.cls)}>{st.label}</p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Priority</label>
                <div className="relative">
                  <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="appearance-none w-full h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors">
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p} className="bg-[#1C1611] capitalize">{PRIORITY_CONFIG[p].label}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Assignee</label>
                <div className="relative">
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value)}
                    className="appearance-none w-full h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors">
                    {ASSIGNEES.map((a) => (
                      <option key={a} value={a} className="bg-[#1C1611]">{a}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>

              {/* Due date */}
              {ticket.dueAt && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Due By</label>
                  <div className="flex items-center gap-1.5 text-[12.5px] text-amber-400">
                    <Clock size={12} />
                    {ticket.dueAt}
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Category</label>
                <p className="text-[12.5px] text-[#7A6045] capitalize">{ticket.category.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-3">Customer</h3>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8924A] to-[#6B4A20] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                {ticket.customer.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <Link href={`/customers/${ticket.customer.id}`}
                  className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors block">
                  {ticket.customer.name}
                </Link>
                <p className="text-[11px] text-[#5A4232]">{ticket.customer.email}</p>
              </div>
            </div>
          </div>

          {/* SLA warning */}
          <div className="rounded-[12px] bg-amber-400/10 border border-amber-400/20 p-4 flex items-start gap-3">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-semibold text-amber-400">SLA Due Soon</p>
              <p className="text-[11px] text-amber-400/70 mt-0.5">This ticket is due by {ticket.dueAt}. Ensure a resolution or update is provided before then.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}