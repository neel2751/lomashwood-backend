"use client";

import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin,
  FileText, RefreshCcw, Printer,
  ChevronDown, Package,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, type OrderStatus } from "./OrderStatusBadge";
import { OrderTimeline } from "./OrderTimeline";

interface OrderDetailProps {
  orderId?: string;
}

const MOCK_ORDER = {
  id: "1",
  orderNo: "#1048",
  status: "completed" as OrderStatus,
  date: "28 Feb 2026, 09:14",
  type: "Kitchen & Bedroom",
  customer: {
    name: "James Thornton",
    email: "james.t@email.com",
    phone: "+44 7700 900123",
    address: "14 Maple Street, London, SW4 7AJ",
  },
  products: [
    { id: "1", title: "Luna White Kitchen", size: "Standard", colour: "Pure White", qty: 1, price: 6400 },
    { id: "2", title: "Halo Oak Bedroom",   size: "Double",   colour: "Natural Oak", qty: 1, price: 2000 },
  ],
  subtotal: 8400,
  vat: 1680,
  total: 10080,
  payment: {
    method: "Credit Card",
    last4: "4242",
    status: "paid",
    transactionId: "TXN9821",
    paidAt: "28 Feb 2026, 09:15",
  },
  notes: "Customer requested installation before 5pm.",
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending","processing","confirmed","dispatched","delivered","completed","cancelled",
];

export function OrderDetail({ orderId }: OrderDetailProps) {
  const order = MOCK_ORDER;
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-[#E8D5B7]">{order.orderNo}</h1>
              <OrderStatusBadge status={status} />
            </div>
            <p className="text-[12px] text-[#5A4232] mt-0.5">{order.date} · {order.type}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <Printer size={13} /> Print
          </button>
          <Link href={`/orders/invoices/${order.id}`}
            className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <FileText size={13} /> Invoice
          </Link>
          <Link href={`/orders/refunds/new`}
            className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <RefreshCcw size={13} /> Refund
          </Link>

          {/* Status changer */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors"
            >
              Update Status <ChevronDown size={13} className={cn("transition-transform", showStatusMenu && "rotate-180")} />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[180px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => { setStatus(s); setShowStatusMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] transition-all",
                      s === status ? "bg-[#C8924A]/15 text-[#C8924A]" : "text-[#7A6045] hover:bg-[#2E231A] hover:text-[#C8924A]"
                    )}
                  >
                    <OrderStatusBadge status={s} size="sm" showIcon={false} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left col: Products + Payment */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Products */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2E231A]">
              <Package size={15} className="text-[#C8924A]" />
              <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Products</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2E231A]">
                  {["Product","Size","Colour","Qty","Price"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E231A]">
                {order.products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3.5">
                      <Link href={`/products/${p.id}`} className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">{p.title}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-[#7A6045]">{p.size}</td>
                    <td className="px-5 py-3.5 text-[12.5px] text-[#7A6045]">{p.colour}</td>
                    <td className="px-5 py-3.5 text-[12.5px] text-[#E8D5B7] font-medium">{p.qty}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-[#E8D5B7]">£{p.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            <div className="border-t border-[#2E231A] px-5 py-4 space-y-2">
              {[
                { label: "Subtotal", value: `£${order.subtotal.toLocaleString()}`, bold: false },
                { label: "VAT (20%)", value: `£${order.vat.toLocaleString()}`, bold: false },
                { label: "Total", value: `£${order.total.toLocaleString()}`, bold: true },
              ].map(({ label, value, bold }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className={cn("text-[12.5px]", bold ? "font-semibold text-[#E8D5B7]" : "text-[#5A4232]")}>{label}</span>
                  <span className={cn("text-[13px]", bold ? "font-bold text-[#C8924A]" : "text-[#7A6045]")}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-4">Payment</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Method",         value: `${order.payment.method} ····${order.payment.last4}` },
                { label: "Status",         value: order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1) },
                { label: "Transaction ID", value: order.payment.transactionId },
                { label: "Paid At",        value: order.payment.paidAt },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] mb-0.5">{label}</p>
                  <p className="text-[12.5px] text-[#C8B99A]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <OrderTimeline />
        </div>

        {/* Right col: Customer + Notes */}
        <div className="flex flex-col gap-5">
          {/* Customer */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-4">Customer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                {order.customer.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <Link href="/customers/1" className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">
                  {order.customer.name}
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: Mail,   value: order.customer.email },
                { icon: Phone,  value: order.customer.phone },
                { icon: MapPin, value: order.customer.address },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-start gap-2.5">
                  <Icon size={13} className="text-[#C8924A] mt-0.5 shrink-0" />
                  <span className="text-[12px] text-[#7A6045] leading-snug">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
              <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-3">Notes</h3>
              <p className="text-[12.5px] text-[#7A6045] leading-relaxed italic">"{order.notes}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}