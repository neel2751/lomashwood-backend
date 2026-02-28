"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, ChevronDown, MoreHorizontal,
  Eye, FileText, RefreshCcw, Trash2, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, type OrderStatus } from "./OrderStatusBadge";

interface Order {
  id: string;
  orderNo: string;
  customer: string;
  email: string;
  type: "Kitchen" | "Bedroom" | "Kitchen & Bedroom";
  products: string[];
  amount: number;
  status: OrderStatus;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  date: string;
}

const MOCK_ORDERS: Order[] = [
  { id: "1", orderNo: "#1048", customer: "James Thornton",  email: "james.t@email.com",  type: "Kitchen",           products: ["Luna White"],                  amount: 8400,  status: "completed",  paymentStatus: "paid",     date: "28 Feb 2026" },
  { id: "2", orderNo: "#1047", customer: "Sarah Mitchell",  email: "sarah.m@email.com",  type: "Bedroom",           products: ["Halo Oak"],                    amount: 3200,  status: "processing", paymentStatus: "paid",     date: "27 Feb 2026" },
  { id: "3", orderNo: "#1046", customer: "Oliver Patel",    email: "oliver.p@email.com", type: "Kitchen & Bedroom", products: ["Slate Grey", "Nordic Birch"],  amount: 14600, status: "confirmed",  paymentStatus: "paid",     date: "27 Feb 2026" },
  { id: "4", orderNo: "#1045", customer: "Emma Lawson",     email: "emma.l@email.com",   type: "Kitchen",           products: ["Luna White"],                  amount: 6800,  status: "refunded",   paymentStatus: "refunded", date: "26 Feb 2026" },
  { id: "5", orderNo: "#1044", customer: "Daniel Huang",    email: "daniel.h@email.com", type: "Bedroom",           products: ["Nordic Birch"],                amount: 2900,  status: "dispatched", paymentStatus: "paid",     date: "26 Feb 2026" },
  { id: "6", orderNo: "#1043", customer: "Priya Sharma",    email: "priya.s@email.com",  type: "Kitchen",           products: ["Pebble J-Pull"],               amount: 9100,  status: "cancelled",  paymentStatus: "failed",   date: "25 Feb 2026" },
  { id: "7", orderNo: "#1042", customer: "Tom Hendricks",   email: "tom.h@email.com",    type: "Kitchen & Bedroom", products: ["Ash Handleless", "Halo Oak"],  amount: 17200, status: "delivered",  paymentStatus: "paid",     date: "24 Feb 2026" },
  { id: "8", orderNo: "#1041", customer: "Aisha Okoye",     email: "aisha.o@email.com",  type: "Bedroom",           products: ["Linen Shaker"],                amount: 4100,  status: "pending",    paymentStatus: "pending",  date: "23 Feb 2026" },
];

const PAYMENT_STYLES: Record<string, string> = {
  paid:     "bg-emerald-400/10 text-emerald-400",
  pending:  "bg-[#C8924A]/15 text-[#C8924A]",
  failed:   "bg-red-400/10 text-red-400",
  refunded: "bg-amber-400/10 text-amber-400",
};

export function OrderTable() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<"All" | OrderStatus>("All");
  const [typeFilter, setType]     = useState<"All" | string>("All");
  const [openMenu, setOpenMenu]   = useState<string | null>(null);
  const [selected, setSelected]   = useState<string[]>([]);

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchSearch =
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    const matchType   = typeFilter   === "All" || o.type    === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((o) => o.id));

  const totalRevenue = filtered.reduce((s, o) => s + o.amount, 0);

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[220px]"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40"
          >
            <option value="All">All Status</option>
            {["pending","processing","confirmed","dispatched","delivered","completed","cancelled","refunded"].map((s) => (
              <option key={s} value={s} className="bg-[#1C1611] capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {/* Type filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40"
          >
            <option value="All">All Types</option>
            <option value="Kitchen" className="bg-[#1C1611]">Kitchen</option>
            <option value="Bedroom" className="bg-[#1C1611]">Bedroom</option>
            <option value="Kitchen & Bedroom" className="bg-[#1C1611]">Kitchen & Bedroom</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {selected.length > 0 && (
          <span className="text-[11px] text-[#C8924A] bg-[#C8924A]/10 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12px] text-[#5A4232]">
            Total: <span className="text-[#E8D5B7] font-semibold">£{totalRevenue.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              <th className="px-5 py-3 w-10">
                <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll} className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
              </th>
              {["Order", "Customer", "Type", "Products", "Amount", "Payment", "Status", "Date", ""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((order) => (
              <tr key={order.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="px-5 py-3.5">
                  <input type="checkbox" checked={selected.includes(order.id)}
                    onChange={() => toggleSelect(order.id)}
                    className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
                </td>

                {/* Order no */}
                <td className="px-3 py-3.5">
                  <Link href={`/orders/${order.id}`}
                    className="text-[13px] font-semibold text-[#C8924A] hover:text-[#E8D5B7] transition-colors">
                    {order.orderNo}
                  </Link>
                </td>

                {/* Customer */}
                <td className="px-3 py-3.5">
                  <p className="text-[12.5px] font-medium text-[#C8B99A]">{order.customer}</p>
                  <p className="text-[11px] text-[#5A4232]">{order.email}</p>
                </td>

                {/* Type */}
                <td className="px-3 py-3.5">
                  <span className={cn(
                    "text-[10.5px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                    order.type === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]"
                    : order.type === "Bedroom" ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                    : "bg-purple-400/10 text-purple-400"
                  )}>
                    {order.type}
                  </span>
                </td>

                {/* Products */}
                <td className="px-3 py-3.5 max-w-[160px]">
                  <p className="text-[11.5px] text-[#7A6045] truncate">{order.products.join(", ")}</p>
                </td>

                {/* Amount */}
                <td className="px-3 py-3.5">
                  <span className="text-[13px] font-semibold text-[#E8D5B7]">
                    £{order.amount.toLocaleString()}
                  </span>
                </td>

                {/* Payment */}
                <td className="px-3 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium capitalize",
                    PAYMENT_STYLES[order.paymentStatus])}>
                    {order.paymentStatus}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-3.5">
                  <OrderStatusBadge status={order.status} size="sm" showIcon={false} />
                </td>

                {/* Date */}
                <td className="px-3 py-3.5">
                  <span className="text-[11px] text-[#5A4232] whitespace-nowrap">{order.date}</span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3.5 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === order.id ? null : order.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenu === order.id && (
                    <div className="absolute right-3 top-full mt-1 z-20 w-[170px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                      {[
                        { icon: Eye,         label: "View Order",   href: `/orders/${order.id}`           },
                        { icon: FileText,    label: "View Invoice", href: `/orders/invoices/${order.id}`  },
                        { icon: RefreshCcw,  label: "Refund",       href: `/orders/refunds/new`           },
                      ].map(({ icon: Icon, label, href }) => (
                        <Link key={label} href={href} onClick={() => setOpenMenu(null)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
                        >
                          <Icon size={13} /> {label}
                        </Link>
                      ))}
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-red-400 hover:bg-red-400/10 transition-all border-t border-[#2E231A]">
                        <Trash2 size={13} /> Cancel Order
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#2E231A] flex items-center justify-between">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} orders</span>
        <span className="text-[12px] text-[#3D2E1E]">Page 1 of 1</span>
      </div>
    </div>
  );
}