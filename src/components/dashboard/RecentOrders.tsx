"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { useOrders } from "@/hooks/useOrders";

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

interface OrderItem {
  productCategory?: string;
}

interface RawOrder {
  id: string;
  orderNumber?: string;
  customerName?: string;
  total?: number;
  status?: string;
  createdAt?: string;
  items?: OrderItem[];
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  completed:  "bg-emerald-400/10 text-emerald-400",
  processing: "bg-[#C8924A]/10 text-[#C8924A]",
  pending:    "bg-[#6B8A9A]/15 text-[#6B8A9A]",
  refunded:   "bg-purple-400/10 text-purple-400",
  cancelled:  "bg-red-400/10 text-red-400",
};

const gbNumber = new Intl.NumberFormat("en-GB");

export function RecentOrders() {
  const { data, isLoading, isError } = useOrders({ page: 1, limit: 6 });
  const rawOrders = ((data as { data?: RawOrder[] } | undefined)?.data ?? []) as RawOrder[];

  const recentOrders: RecentOrder[] = rawOrders.slice(0, 6).map((order) => {
    const categories = new Set((order.items ?? []).map((item) => item.productCategory?.toLowerCase()));
    const type: RecentOrder["type"] =
      categories.has("kitchen") && categories.has("bedroom")
        ? "Kitchen & Bedroom"
        : categories.has("bedroom")
          ? "Bedroom"
          : "Kitchen";

    const status = (order.status ?? "pending") as OrderStatus;

    return {
      id: order.id,
      orderNo: order.orderNumber ?? order.id.slice(-6),
      customer: order.customerName ?? "Unknown customer",
      type,
      amount: order.total ?? 0,
      status,
      date: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
        : "-",
    };
  });

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
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[13px] text-[#5A4232]">Loading recent orders...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[13px] text-red-400">Failed to load recent orders.</td>
              </tr>
            ) : recentOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[13px] text-[#5A4232]">No recent orders.</td>
              </tr>
            ) : (
              recentOrders.map((order) => (
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
                    £{gbNumber.format(order.amount)}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium capitalize",
                      STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
                    )}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  <span className="text-[11px] text-[#5A4232]">{order.date}</span>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}