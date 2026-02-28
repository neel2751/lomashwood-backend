"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, CreditCard, ExternalLink, RefreshCcw, Copy, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const MOCK_PAYMENT = {
  id: "1",
  transactionId: "TXN9821",
  orderNo: "#1048",
  orderId: "1",
  customer: { name: "James Thornton", email: "james.t@email.com" },
  method: "Credit Card",
  last4: "4242",
  brand: "Visa",
  amount: 8400,
  vat: 1680,
  total: 10080,
  status: "paid",
  paidAt: "28 Feb 2026, 09:15",
  gateway: "Stripe",
  gatewayRef: "pi_3OxH2L2eZvKYlo2C1X8fPq7n",
  breakdown: [
    { label: "Luna White Kitchen",    amount: 6400 },
    { label: "Halo Oak Bedroom",      amount: 2000 },
  ],
};

const STATUS_STYLES: Record<string, string> = {
  paid:               "bg-emerald-400/10 text-emerald-400",
  pending:            "bg-[#C8924A]/15 text-[#C8924A]",
  failed:             "bg-red-400/10 text-red-400",
  refunded:           "bg-amber-400/10 text-amber-400",
  partially_refunded: "bg-purple-400/10 text-purple-400",
};

export function PaymentDetail() {
  const payment = MOCK_PAYMENT;
  const [copied, setCopied] = useState(false);

  const copyRef = () => {
    navigator.clipboard.writeText(payment.gatewayRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders/payments"
          className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-[18px] font-bold text-[#E8D5B7]">{payment.transactionId}</h1>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Payment for order{" "}
            <Link href={`/orders/${payment.orderId}`} className="text-[#C8924A] hover:underline">{payment.orderNo}</Link>
          </p>
        </div>
        <span className={cn("ml-auto text-[11px] px-2.5 py-1 rounded-full font-medium capitalize", STATUS_STYLES[payment.status])}>
          {payment.status.replace("_", " ")}
        </span>
      </div>

      {/* Main card */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
        {/* Amount hero */}
        <div className="px-6 py-8 bg-gradient-to-br from-[#2E231A] to-[#1C1611] border-b border-[#2E231A] text-center">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase text-[#5A4232] mb-1">Amount Paid</p>
          <p className="text-[40px] font-bold text-[#E8D5B7] leading-none">
            <span className="text-[24px] text-[#7A6045]">£</span>
            {payment.total.toLocaleString()}
          </p>
          <p className="text-[12px] text-[#5A4232] mt-2">incl. £{payment.vat.toLocaleString()} VAT · {payment.paidAt}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-0 divide-y divide-x divide-[#2E231A]">
          {[
            { label: "Payment Method",  value: `${payment.brand} ····${payment.last4}` },
            { label: "Gateway",         value: payment.gateway },
            { label: "Customer",        value: payment.customer.name },
            { label: "Email",           value: payment.customer.email },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-4">
              <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] mb-1">{label}</p>
              <p className="text-[13px] text-[#C8B99A]">{value}</p>
            </div>
          ))}
        </div>

        {/* Gateway ref */}
        <div className="px-5 py-4 border-t border-[#2E231A]">
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] mb-1.5">Gateway Reference</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11.5px] font-mono text-[#C8924A] bg-[#2E231A] px-3 py-2 rounded-[8px] truncate">
              {payment.gatewayRef}
            </code>
            <button
              onClick={copyRef}
              className="flex items-center justify-center w-8 h-8 rounded-[7px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-all"
            >
              {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <button className="flex items-center justify-center w-8 h-8 rounded-[7px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-all">
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border-t border-[#2E231A] px-5 py-4">
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] mb-3">Breakdown</p>
          <div className="flex flex-col gap-2">
            {payment.breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[12.5px] text-[#7A6045]">{item.label}</span>
                <span className="text-[12.5px] font-medium text-[#E8D5B7]">£{item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-[#2E231A]">
              <span className="text-[12.5px] text-[#5A4232]">VAT (20%)</span>
              <span className="text-[12.5px] text-[#7A6045]">£{payment.vat.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#E8D5B7]">Total</span>
              <span className="text-[14px] font-bold text-[#C8924A]">£{payment.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/orders/refunds/new`}
          className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
          <RefreshCcw size={13} /> Issue Refund
        </Link>
        <Link href={`/orders/${payment.orderId}`}
          className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
          <ExternalLink size={13} /> View Order
        </Link>
      </div>
    </div>
  );
}