"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Download, Eye, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type InvoiceStatus = "paid" | "unpaid" | "overdue" | "voided";

interface Invoice {
  id: string;
  invoiceNo: string;
  orderNo: string;
  orderId: string;
  customer: string;
  email: string;
  amount: number;
  vat: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}

const MOCK_INVOICES: Invoice[] = [
  { id: "1", invoiceNo: "INV-1048", orderNo: "#1048", orderId: "1", customer: "James Thornton",  email: "james.t@email.com",  amount: 8400,  vat: 1680, total: 10080, status: "paid",   issuedAt: "28 Feb 2026", dueAt: "14 Mar 2026" },
  { id: "2", invoiceNo: "INV-1047", orderNo: "#1047", orderId: "2", customer: "Sarah Mitchell",  email: "sarah.m@email.com",  amount: 3200,  vat: 640,  total: 3840,  status: "unpaid", issuedAt: "27 Feb 2026", dueAt: "13 Mar 2026" },
  { id: "3", invoiceNo: "INV-1046", orderNo: "#1046", orderId: "3", customer: "Oliver Patel",    email: "oliver.p@email.com", amount: 14600, vat: 2920, total: 17520, status: "paid",   issuedAt: "27 Feb 2026", dueAt: "13 Mar 2026" },
  { id: "4", invoiceNo: "INV-1045", orderNo: "#1045", orderId: "4", customer: "Emma Lawson",     email: "emma.l@email.com",   amount: 6800,  vat: 1360, total: 8160,  status: "voided", issuedAt: "26 Feb 2026", dueAt: "12 Mar 2026" },
  { id: "5", invoiceNo: "INV-1043", orderNo: "#1043", orderId: "6", customer: "Priya Sharma",    email: "priya.s@email.com",  amount: 9100,  vat: 1820, total: 10920, status: "overdue",issuedAt: "25 Feb 2026", dueAt: "11 Mar 2026" },
  { id: "6", invoiceNo: "INV-1041", orderNo: "#1041", orderId: "8", customer: "Aisha Okoye",     email: "aisha.o@email.com",  amount: 4100,  vat: 820,  total: 4920,  status: "unpaid", issuedAt: "23 Feb 2026", dueAt: "09 Mar 2026" },
];

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid:    "bg-emerald-400/10 text-emerald-400",
  unpaid:  "bg-[#C8924A]/15 text-[#C8924A]",
  overdue: "bg-red-400/10 text-red-400",
  voided:  "bg-[#3D2E1E] text-[#5A4232]",
};

export function InvoiceTable() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<"All" | InvoiceStatus>("All");

  const filtered = MOCK_INVOICES.filter((inv) => {
    const matchSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const overdueCount = MOCK_INVOICES.filter((i) => i.status === "overdue").length;

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-400/10 border-b border-red-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-[12px] text-red-400">
            {overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""} — action required
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices…"
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
            <option value="paid" className="bg-[#1C1611]">Paid</option>
            <option value="unpaid" className="bg-[#1C1611]">Unpaid</option>
            <option value="overdue" className="bg-[#1C1611]">Overdue</option>
            <option value="voided" className="bg-[#1C1611]">Voided</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Invoice", "Order", "Customer", "Subtotal", "VAT", "Total", "Status", "Issued", "Due", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((inv) => (
              <tr key={inv.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="px-4 py-3.5">
                  <Link href={`/orders/invoices/${inv.id}`}
                    className="text-[12.5px] font-semibold text-[#C8924A] hover:text-[#E8D5B7] transition-colors font-mono">
                    {inv.invoiceNo}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/orders/${inv.orderId}`} className="text-[12.5px] text-[#7A6045] hover:text-[#C8924A] transition-colors">
                    {inv.orderNo}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-[12.5px] text-[#C8B99A]">{inv.customer}</p>
                  <p className="text-[11px] text-[#5A4232]">{inv.email}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] text-[#7A6045]">£{inv.amount.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] text-[#5A4232]">£{inv.vat.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[13px] font-semibold text-[#E8D5B7]">£{inv.total.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium capitalize", STATUS_STYLES[inv.status])}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] text-[#5A4232] whitespace-nowrap">{inv.issuedAt}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[11px] whitespace-nowrap", inv.status === "overdue" ? "text-red-400 font-medium" : "text-[#5A4232]")}>
                    {inv.dueAt}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/orders/invoices/${inv.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="View">
                      <Eye size={13} />
                    </Link>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="Download">
                      <Download size={13} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="Resend">
                      <Send size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} invoices</span>
      </div>
    </div>
  );
}