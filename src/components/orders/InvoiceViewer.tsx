"use client";

import Link from "next/link";

import { ArrowLeft, Download, Send, Printer } from "lucide-react";

import { cn } from "@/lib/utils";

const MOCK_INVOICE = {
  invoiceNo:  "INV-1048",
  orderId:    "1",
  orderNo:    "#1048",
  status:     "paid",
  issuedAt:   "28 February 2026",
  dueAt:      "14 March 2026",
  paidAt:     "28 February 2026",
  from: {
    company: "Lomash Wood Ltd",
    address: ["Unit 4, Timber Yard, Industrial Estate", "Manchester, M1 2AB", "United Kingdom"],
    email:   "accounts@lomashwood.co.uk",
    vat:     "GB 123456789",
  },
  to: {
    name:    "James Thornton",
    address: ["14 Maple Street", "London, SW4 7AJ", "United Kingdom"],
    email:   "james.t@email.com",
  },
  items: [
    { description: "Luna White Kitchen — Standard — Pure White", qty: 1, unitPrice: 6400, total: 6400 },
    { description: "Halo Oak Bedroom — Double — Natural Oak",    qty: 1, unitPrice: 2000, total: 2000 },
    { description: "Installation & Fitting Service",             qty: 1, unitPrice: 0,    total: 0    },
  ],
  subtotal: 8400,
  vat:      1680,
  total:    10080,
  payment: {
    method: "Credit Card (Visa ····4242)",
    ref:    "TXN9821",
  },
  notes: "Thank you for choosing Lomash Wood. If you have any questions about this invoice, please contact us at accounts@lomashwood.co.uk.",
};

const STATUS_STYLES: Record<string, string> = {
  paid:    "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  unpaid:  "bg-[#C8924A]/15 text-[#C8924A] border-[#C8924A]/20",
  overdue: "bg-red-400/10 text-red-400 border-red-400/20",
  voided:  "bg-[#3D2E1E] text-[#5A4232] border-[#3D2E1E]",
};

export function InvoiceViewer() {
  const inv = MOCK_INVOICE;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/orders/invoices"
          className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <h1 className="text-[18px] font-bold text-[#E8D5B7]">{inv.invoiceNo}</h1>
        <span className={cn("text-[11px] px-2.5 py-1 rounded-full font-medium border capitalize", STATUS_STYLES[inv.status])}>
          {inv.status}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <Printer size={13} /> Print
          </button>
          <button className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <Send size={13} /> Resend
          </button>
          <button className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
            <Download size={13} /> Download PDF
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
        {/* Invoice header */}
        <div className="p-8 border-b border-[#2E231A]">
          <div className="flex items-start justify-between gap-6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] flex items-center justify-center shadow-lg">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 13 L8 3 L14 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.5 9 L11.5 9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[15px] font-bold text-[#E8D5B7] tracking-wide">Lomash Wood</span>
              </div>
              {inv.from.address.map((line) => (
                <p key={line} className="text-[12px] text-[#5A4232]">{line}</p>
              ))}
              <p className="text-[12px] text-[#5A4232] mt-1">{inv.from.email}</p>
              <p className="text-[12px] text-[#5A4232]">VAT: {inv.from.vat}</p>
            </div>

            {/* Invoice meta */}
            <div className="text-right shrink-0">
              <p className="text-[28px] font-bold text-[#C8924A] leading-none">{inv.invoiceNo}</p>
              <p className="text-[11px] text-[#3D2E1E] mt-1 uppercase tracking-wider">Tax Invoice</p>
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] text-[#3D2E1E]">Issued:</span>
                  <span className="text-[12px] text-[#7A6045]">{inv.issuedAt}</span>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] text-[#3D2E1E]">Due:</span>
                  <span className="text-[12px] text-[#7A6045]">{inv.dueAt}</span>
                </div>
                {inv.paidAt && (
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-[11px] text-[#3D2E1E]">Paid:</span>
                    <span className="text-[12px] text-emerald-400 font-medium">{inv.paidAt}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="mt-6 pt-6 border-t border-[#2E231A]">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Bill To</p>
            <p className="text-[13px] font-semibold text-[#E8D5B7]">{inv.to.name}</p>
            {inv.to.address.map((line) => (
              <p key={line} className="text-[12px] text-[#5A4232]">{line}</p>
            ))}
            <p className="text-[12px] text-[#5A4232]">{inv.to.email}</p>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2E231A] bg-[#221A12]">
              {["Description", "Qty", "Unit Price", "Total"].map((h) => (
                <th key={h} className={cn(
                  "px-6 py-3 text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]",
                  h === "Description" ? "text-left" : "text-right"
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {inv.items.map((item, i) => (
              <tr key={i}>
                <td className="px-6 py-4 text-[13px] text-[#C8B99A]">{item.description}</td>
                <td className="px-6 py-4 text-[12.5px] text-[#7A6045] text-right">{item.qty}</td>
                <td className="px-6 py-4 text-[12.5px] text-[#7A6045] text-right">
                  {item.unitPrice > 0 ? `£${item.unitPrice.toLocaleString()}` : "Included"}
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-[#E8D5B7] text-right">
                  {item.total > 0 ? `£${item.total.toLocaleString()}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-[#2E231A] px-6 py-5">
          <div className="flex justify-end">
            <div className="w-60 space-y-2">
              {[
                { label: "Subtotal", value: `£${inv.subtotal.toLocaleString()}`, bold: false },
                { label: "VAT (20%)", value: `£${inv.vat.toLocaleString()}`, bold: false },
              ].map(({ label, value, bold }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[12px] text-[#5A4232]">{label}</span>
                  <span className="text-[12px] text-[#7A6045]">{value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-[#2E231A]">
                <span className="text-[14px] font-bold text-[#E8D5B7]">Total</span>
                <span className="text-[14px] font-bold text-[#C8924A]">£{inv.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment info + notes */}
        <div className="border-t border-[#2E231A] px-6 py-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Payment Details</p>
            <p className="text-[12.5px] text-[#7A6045]">{inv.payment.method}</p>
            <p className="text-[12px] text-[#5A4232] font-mono">Ref: {inv.payment.ref}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Notes</p>
            <p className="text-[12px] text-[#5A4232] leading-relaxed">{inv.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}