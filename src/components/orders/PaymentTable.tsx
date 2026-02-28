"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, Eye, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentStatus = "paid" | "pending" | "failed" | "refunded" | "partially_refunded";
type PaymentMethod = "credit_card" | "debit_card" | "bank_transfer" | "finance";

interface Payment {
  id: string;
  transactionId: string;
  orderNo: string;
  orderId: string;
  customer: string;
  method: PaymentMethod;
  last4?: string;
  amount: number;
  status: PaymentStatus;
  date: string;
}

const MOCK_PAYMENTS: Payment[] = [
  { id: "1", transactionId: "TXN9821", orderNo: "#1048", orderId: "1", customer: "James Thornton",  method: "credit_card",   last4: "4242", amount: 8400,  status: "paid",               date: "28 Feb 2026" },
  { id: "2", transactionId: "TXN9820", orderNo: "#1047", orderId: "2", customer: "Sarah Mitchell",  method: "debit_card",    last4: "1234", amount: 3200,  status: "paid",               date: "27 Feb 2026" },
  { id: "3", transactionId: "TXN9819", orderNo: "#1046", orderId: "3", customer: "Oliver Patel",    method: "bank_transfer", last4: undefined,amount:14600, status: "paid",               date: "27 Feb 2026" },
  { id: "4", transactionId: "TXN9818", orderNo: "#1045", orderId: "4", customer: "Emma Lawson",     method: "credit_card",   last4: "5678", amount: 6800,  status: "refunded",           date: "26 Feb 2026" },
  { id: "5", transactionId: "TXN9817", orderNo: "#1044", orderId: "5", customer: "Daniel Huang",    method: "finance",       last4: undefined,amount: 2900, status: "paid",               date: "26 Feb 2026" },
  { id: "6", transactionId: "TXN9816", orderNo: "#1043", orderId: "6", customer: "Priya Sharma",    method: "credit_card",   last4: "9876", amount: 9100,  status: "failed",             date: "25 Feb 2026" },
  { id: "7", transactionId: "TXN9815", orderNo: "#1042", orderId: "7", customer: "Tom Hendricks",   method: "bank_transfer", last4: undefined,amount:17200, status: "partially_refunded", date: "24 Feb 2026" },
  { id: "8", transactionId: "TXN9814", orderNo: "#1041", orderId: "8", customer: "Aisha Okoye",     method: "credit_card",   last4: "3333", amount: 4100,  status: "pending",            date: "23 Feb 2026" },
];

const STATUS_STYLES: Record<PaymentStatus, string> = {
  paid:               "bg-emerald-400/10 text-emerald-400",
  pending:            "bg-[#C8924A]/15 text-[#C8924A]",
  failed:             "bg-red-400/10 text-red-400",
  refunded:           "bg-amber-400/10 text-amber-400",
  partially_refunded: "bg-purple-400/10 text-purple-400",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid:               "Paid",
  pending:            "Pending",
  failed:             "Failed",
  refunded:           "Refunded",
  partially_refunded: "Part. Refunded",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card:   "Credit Card",
  debit_card:    "Debit Card",
  bank_transfer: "Bank Transfer",
  finance:       "Finance",
};

export function PaymentTable() {
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatus] = useState<"All" | PaymentStatus>("All");

  const filtered = MOCK_PAYMENTS.filter((p) => {
    const matchSearch =
      p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.orderNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = filtered.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

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
            placeholder="Search transaction, customer…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[230px]"
          />
        </div>
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40"
          >
            <option value="All">All Status</option>
            {Object.keys(STATUS_LABELS).map((s) => (
              <option key={s} value={s} className="bg-[#1C1611]">{STATUS_LABELS[s as PaymentStatus]}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>
        <div className="ml-auto text-[12px] text-[#5A4232]">
          Paid: <span className="text-[#E8D5B7] font-semibold">£{totalPaid.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Transaction", "Order", "Customer", "Method", "Amount", "Status", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((payment) => (
              <tr key={payment.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="px-4 py-3.5">
                  <span className="text-[12px] font-mono text-[#C8924A]">{payment.transactionId}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/orders/${payment.orderId}`} className="text-[12.5px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">
                    {payment.orderNo}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] text-[#7A6045]">{payment.customer}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12px] text-[#5A4232]">
                    {METHOD_LABELS[payment.method]}
                    {payment.last4 && <span className="ml-1 font-mono">····{payment.last4}</span>}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[13px] font-semibold text-[#E8D5B7]">£{payment.amount.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[payment.status])}>
                    {STATUS_LABELS[payment.status]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] text-[#5A4232]">{payment.date}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/orders/payments/${payment.id}`}
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
        <span className="text-[12px] text-[#5A4232]">{filtered.length} payments</span>
      </div>
    </div>
  );
}