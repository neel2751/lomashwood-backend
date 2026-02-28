"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type OrderStatus = "completed" | "processing" | "pending" | "refunded" | "cancelled";

interface RecentOrder {
  id: string;
  orderNo: string;
  customer: string;
  type: "Kitchen" | "Bedroom" | "Kitchen & Bedroom";
  amount: number;
  status: OrderStatus;
  date: string;
}

const MOCK_ORDERS: RecentOrder[] = [
  { id: "1", orderNo: "#1048", customer: "James Thornton",  type: "Kitchen",           amount: 8400,  status: "completed",  date: "28 Feb" },
  { id: "2", orderNo: "#1047", customer: "Sarah Mitchell",  type: "Bedroom",           amount: 3200,  status: "processing", date: "27 Feb" },
  { id: "3", orderNo: "#1046", customer: "Oliver Patel",    type: "Kitchen & Bedroom", amount: 14600, status: "pending",    date: "27 Feb" },
  { id: "4", orderNo: "#1045", customer: "Emma Lawson",     type: "Kitchen",           amount: 6800,  status: "refunded",   date: "26 Feb" },
  { id: "5", orderNo: "#1044", customer: "Daniel Huang",    type: "Bedroom",           amount: 2900,  status: "completed",  date: "26 Feb" },
  { id: "6", orderNo: "#1043", customer: "Priya Sharma",    type: "Kitchen",           amount: 9100,  status: "cancelled",  date: "25 Feb" },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  completed:  "bg-emerald-400/10 text-emerald-400",
  processing: "bg-[#C8924A]/10 text-[#C8924A]",
  pending:    "bg-[#6B8A9A]/15 text-[#6B8A9A]",
  refunded:   "bg-purple-400/10 text-purple-400",
  cancelled:  "bg-red-400/10 text-red-400",
};

export function RecentOrders() {
  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Recent Orders</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Latest customer orders</p>
        </div>
        <Link
          href="/orders"
          className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr>
              {["Order", "Customer", "Type", "Amount", "Status", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-1 pb-2.5 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] first:pl-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {MOCK_ORDERS.map((order) => (
              <tr key={order.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="py-2.5 pr-3 pl-0">
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-[12.5px] font-medium text-[#C8924A] hover:text-[#E8D5B7] transition-colors"
                  >
                    {order.orderNo}
                  </Link>
                </td>
                <td className="px-1 py-2.5">
                  <span className="text-[12.5px] text-[#9A7A5A] group-hover:text-[#C8B99A] transition-colors">
                    {order.customer}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  <span className="text-[11px] text-[#5A4232]">{order.type}</span>
                </td>
                <td className="px-1 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#E8D5B7]">
                    £{order.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium capitalize",
                      STATUS_STYLES[order.status]
                    )}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  <span className="text-[11px] text-[#5A4232]">{order.date}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}