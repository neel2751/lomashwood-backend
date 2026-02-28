"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Eye, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type RefundStatus = "pending" | "approved" | "processing" | "completed" | "rejected";

interface Refund {
  id: string;
  refundNo: string;
  orderNo: string;
  orderId: string;
  customer: string;
  reason: string;
  amount: number;
  status: RefundStatus;
  requestedAt: string;
  resolvedAt?: string;
}

const MOCK_REFUNDS: Refund[] = [
  { id: "1", refundNo: "REF-0041", orderNo: "#1045", orderId: "4", customer: "Emma Lawson",   reason: "Product damaged on delivery",       amount: 6800, status: "completed",  requestedAt: "26 Feb 2026", resolvedAt: "28 Feb 2026" },
  { id: "2", refundNo: "REF-0040", orderNo: "#1038", orderId: "8", customer: "Tom Hendricks", reason: "Changed mind before installation",  amount: 4200, status: "pending",    requestedAt: "24 Feb 2026" },
  { id: "3", refundNo: "REF-0039", orderNo: "#1031", orderId: "3", customer: "Priya Sharma",  reason: "Wrong colour delivered",            amount: 9100, status: "approved",   requestedAt: "20 Feb 2026" },
  { id: "4", refundNo: "REF-0038", orderNo: "#1028", orderId: "2", customer: "Aisha Okoye",   reason: "Partial defect — bedroom unit",     amount: 2000, status: "processing", requestedAt: "18 Feb 2026" },
  { id: "5", refundNo: "REF-0037", orderNo: "#1020", orderId: "1", customer: "Daniel Huang",  reason: "Duplicate charge",                  amount: 3200, status: "rejected",   requestedAt: "15 Feb 2026", resolvedAt: "17 Feb 2026" },
];

const STATUS_STYLES: Record<RefundStatus, string> = {
  pending:    "bg-[#6B8A9A]/15 text-[#6B8A9A]",
  approved:   "bg-blue-400/10 text-blue-400",
  processing: "bg-[#C8924A]/15 text-[#C8924A]",
  completed:  "bg-emerald-400/10 text-emerald-400",
  rejected:   "bg-red-400/10 text-red-400",
};

export function RefundTable() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<"All" | RefundStatus>("All");

  const filtered = MOCK_REFUNDS.filter((r) => {
    const matchSearch =
      r.refundNo.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.orderNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingTotal = MOCK_REFUNDS
    .filter((r) => r.status === "pending" || r.status === "approved")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search refunds…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40"
          >
            <option value="All">All Status</option>
            {(["pending","approved","processing","completed","rejected"] as RefundStatus[]).map((s) => (
              <option key={s} value={s} className="bg-[#1C1611] capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>
        <div className="text-[12px] text-[#5A4232]">
          Pending: <span className="text-amber-400 font-semibold">£{pendingTotal.toLocaleString()}</span>
        </div>
        <Link href="/orders/refunds/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={14} /> New Refund
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Refund No", "Order", "Customer", "Reason", "Amount", "Status", "Requested", "Resolved", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((refund) => (
              <tr key={refund.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] font-mono font-semibold text-[#C8924A]">{refund.refundNo}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/orders/${refund.orderId}`} className="text-[12.5px] text-[#7A6045] hover:text-[#C8924A] transition-colors">
                    {refund.orderNo}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] text-[#C8B99A]">{refund.customer}</span>
                </td>
                <td className="px-4 py-3.5 max-w-[200px]">
                  <span className="text-[11.5px] text-[#5A4232] line-clamp-1">{refund.reason}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[13px] font-semibold text-[#E8D5B7]">£{refund.amount.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium capitalize", STATUS_STYLES[refund.status])}>
                    {refund.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] text-[#5A4232] whitespace-nowrap">{refund.requestedAt}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] text-[#5A4232] whitespace-nowrap">{refund.resolvedAt ?? "—"}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/orders/refunds/${refund.id}`}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                    <Eye size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} refunds</span>
      </div>
    </div>
  );
}