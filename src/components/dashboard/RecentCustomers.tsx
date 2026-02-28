"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  interest: "Kitchen" | "Bedroom" | "Kitchen & Bedroom";
  totalSpend: number;
  joinedAt: string;
  hasBooking: boolean;
}

const MOCK_CUSTOMERS: RecentCustomer[] = [
  { id: "1", name: "James Thornton",  email: "james.t@email.com",   interest: "Kitchen",           totalSpend: 8400,  joinedAt: "28 Feb", hasBooking: true  },
  { id: "2", name: "Sarah Mitchell",  email: "sarah.m@email.com",   interest: "Bedroom",           totalSpend: 3200,  joinedAt: "27 Feb", hasBooking: false },
  { id: "3", name: "Oliver Patel",    email: "oliver.p@email.com",  interest: "Kitchen & Bedroom", totalSpend: 14600, joinedAt: "27 Feb", hasBooking: true  },
  { id: "4", name: "Emma Lawson",     email: "emma.l@email.com",    interest: "Kitchen",           totalSpend: 6800,  joinedAt: "26 Feb", hasBooking: true  },
  { id: "5", name: "Daniel Huang",    email: "daniel.h@email.com",  interest: "Bedroom",           totalSpend: 2900,  joinedAt: "25 Feb", hasBooking: false },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "from-[#C8924A] to-[#8B5E2A]",
  "from-[#6B8A9A] to-[#4A6070]",
  "from-[#8B6B4A] to-[#5E4230]",
  "from-[#7A9A6B] to-[#4A6045]",
  "from-[#9A6B8A] to-[#6B4A5E]",
];

export function RecentCustomers() {
  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Recent Customers</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Newly registered this week</p>
        </div>
        <Link
          href="/customers"
          className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-[#2E231A]">
        {MOCK_CUSTOMERS.map((customer, i) => (
          <div key={customer.id} className="flex items-center gap-3 py-3 group">
            {/* Avatar */}
            <div
              className={cn(
                "shrink-0 flex items-center justify-center w-8 h-8 rounded-full",
                "bg-gradient-to-br text-white text-[11px] font-semibold",
                AVATAR_COLORS[i % AVATAR_COLORS.length]
              )}
            >
              {getInitials(customer.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/customers/${customer.id}`}
                className="text-[13px] font-medium text-[#C8B99A] group-hover:text-[#E8D5B7] transition-colors truncate block"
              >
                {customer.name}
              </Link>
              <p className="text-[11px] text-[#5A4232] truncate">{customer.email}</p>
            </div>

            {/* Meta */}
            <div className="shrink-0 text-right">
              <p className="text-[12.5px] font-semibold text-[#E8D5B7]">
                £{customer.totalSpend.toLocaleString()}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    customer.interest === "Kitchen"
                      ? "bg-[#C8924A]/15 text-[#C8924A]"
                      : customer.interest === "Bedroom"
                      ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                      : "bg-[#8B6B4A]/15 text-[#C8B99A]"
                  )}
                >
                  {customer.interest}
                </span>
                {customer.hasBooking && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has booking" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}