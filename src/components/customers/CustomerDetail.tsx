"use client";

import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, MapPin, Star,
  ShoppingBag, CalendarCheck, MessageSquare,
  Pencil, Gift, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerTimeline } from "./CustomerTimeline";

const MOCK_CUSTOMER = {
  id: "1",
  name:      "James Thornton",
  email:     "james.t@email.com",
  phone:     "+44 7700 900123",
  address:   "14 Maple Street, London, SW4 7AJ",
  interest:  "Kitchen" as const,
  status:    "vip" as const,
  joinedAt:  "15 January 2025",
  lastActivity: "28 February 2026",
  totalSpend:   18400,
  ordersCount:  2,
  appointmentsCount: 3,
  loyaltyPoints: 920,
  loyaltyTier: "Gold",
  openTickets: 0,
  avgOrderValue: 9200,
  notes: "Long-term customer. Completed full kitchen refit (Luna White) and interested in bedroom refresh in H2 2026.",
  tags: ["VIP", "Kitchen", "Repeat Buyer", "High Value"],
};

const STATUS_CONFIG = {
  active:   { label: "Active",   cls: "bg-emerald-400/10 text-emerald-400" },
  inactive: { label: "Inactive", cls: "bg-[#3D2E1E] text-[#5A4232]"       },
  vip:      { label: "VIP",      cls: "bg-[#C8924A]/15 text-[#C8924A]"    },
  blocked:  { label: "Blocked",  cls: "bg-red-400/10 text-red-400"        },
};

const INTEREST_CONFIG = {
  Kitchen: "bg-[#C8924A]/15 text-[#C8924A]",
  Bedroom: "bg-[#6B8A9A]/15 text-[#6B8A9A]",
  Both:    "bg-purple-400/10 text-purple-400",
};

const RECENT_ORDERS = [
  { id: "1", orderNo: "#1048", product: "Luna White Kitchen",  amount: 8400,  date: "28 Feb 2025", status: "completed" },
  { id: "2", orderNo: "#1021", product: "Ash Handleless Unit", amount: 10000, date: "12 Jun 2025", status: "completed" },
];

const RECENT_APPTS = [
  { id: "1", type: "Home Visit", consultant: "Sarah Alderton", date: "5 Feb 2025",  status: "completed" },
  { id: "2", type: "Online",     consultant: "Sarah Alderton", date: "12 Mar 2025", status: "completed" },
  { id: "3", type: "Showroom",   consultant: "Marcus Webb",    date: "4 Mar 2026",  status: "confirmed" },
];

export function CustomerDetail() {
  const c = MOCK_CUSTOMER;
  const statusCfg = STATUS_CONFIG[c.status];

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/customers"
            className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C8924A] to-[#6B4A20] flex items-center justify-center text-white text-[16px] font-bold">
                {c.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C8924A] flex items-center justify-center">
                <Star size={8} className="text-white fill-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold text-[#E8D5B7]">{c.name}</h1>
                <span className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-medium", statusCfg.cls)}>
                  {statusCfg.label}
                </span>
                <span className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-medium", INTEREST_CONFIG[c.interest])}>
                  {c.interest}
                </span>
              </div>
              <p className="text-[12px] text-[#5A4232] mt-0.5">Member since {c.joinedAt}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`mailto:${c.email}`}
            className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <Mail size={13} /> Email
          </a>
          <Link href={`/customers/${c.id}/edit`}
            className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
            <Pencil size={13} /> Edit
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp,    label: "Total Spend",    value: `£${c.totalSpend.toLocaleString()}`,  sub: `Avg £${c.avgOrderValue.toLocaleString()} / order` },
          { icon: ShoppingBag,   label: "Orders",         value: c.ordersCount,                        sub: "Completed orders"  },
          { icon: CalendarCheck, label: "Appointments",   value: c.appointmentsCount,                  sub: "All time"          },
          { icon: Gift,          label: "Loyalty Points", value: c.loyaltyPoints.toLocaleString(),     sub: `${c.loyaltyTier} Tier` },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-[12px] bg-[#1C1611] border border-[#2E231A] p-4 group hover:border-[#C8924A]/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} className="text-[#C8924A]" />
              <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{label}</p>
            </div>
            <p className="text-[22px] font-bold text-[#E8D5B7] leading-none">{value}</p>
            <p className="text-[11px] text-[#3D2E1E] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: orders + appointments + timeline */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Recent Orders */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
              <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Orders</h3>
              <Link href={`/orders?customer=${c.id}`} className="text-[11px] text-[#C8924A] hover:underline">View all</Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2E231A]">
                  {["Order","Product","Amount","Date","Status"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E231A]">
                {RECENT_ORDERS.map((o) => (
                  <tr key={o.id} className="hover:bg-[#221A12] transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/orders/${o.id}`} className="text-[12.5px] font-semibold text-[#C8924A] hover:text-[#E8D5B7] transition-colors">{o.orderNo}</Link>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-[#7A6045]">{o.product}</td>
                    <td className="px-5 py-3 text-[12.5px] font-semibold text-[#E8D5B7]">£{o.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-[11px] text-[#5A4232]">{o.date}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium bg-emerald-400/10 text-emerald-400 capitalize">{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Appointments */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
              <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Appointments</h3>
              <Link href={`/appointments?customer=${c.id}`} className="text-[11px] text-[#C8924A] hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-[#2E231A]">
              {RECENT_APPTS.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#221A12] transition-colors">
                  <div>
                    <p className="text-[12.5px] font-medium text-[#C8B99A]">{a.type}</p>
                    <p className="text-[11px] text-[#5A4232]">{a.consultant} · {a.date}</p>
                  </div>
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium capitalize",
                    a.status === "completed" ? "bg-emerald-400/10 text-emerald-400"
                    : a.status === "confirmed" ? "bg-blue-400/10 text-blue-400"
                    : "bg-[#C8924A]/15 text-[#C8924A]")}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <CustomerTimeline />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          {/* Contact */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-4">Contact</h3>
            {[
              { icon: Mail,   value: c.email,   href: `mailto:${c.email}` },
              { icon: Phone,  value: c.phone,   href: `tel:${c.phone}`    },
              { icon: MapPin, value: c.address,  href: undefined           },
            ].map(({ icon: Icon, value, href }) => (
              <div key={value} className="flex items-start gap-2.5 mb-3 last:mb-0">
                <Icon size={13} className="text-[#C8924A] mt-0.5 shrink-0" />
                {href
                  ? <a href={href} className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors leading-snug">{value}</a>
                  : <span className="text-[12px] text-[#7A6045] leading-snug">{value}</span>
                }
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {c.tags.map((tag) => (
                <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-[#2E231A] border border-[#3D2E1E] text-[#7A6045]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-[#C8924A]" /> Internal Notes
            </h3>
            <p className="text-[12.5px] text-[#7A6045] leading-relaxed">{c.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}