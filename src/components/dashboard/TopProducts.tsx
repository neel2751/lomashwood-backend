"use client";

import Link from "next/link";

import { TrendingUp, TrendingDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOrders } from "@/hooks/useOrders";

interface TopProduct {
  id: string;
  rank: number;
  name: string;
  category: "Kitchen" | "Bedroom";
  range: string;
  sales: number;
  revenue: number;
  change: number;
}

interface OrderItem {
  productId: string;
  productTitle?: string;
  productCategory?: string;
  quantity?: number;
  totalPrice?: number;
}

interface Order {
  id: string;
  items?: OrderItem[];
}

const RANK_COLORS = ["text-[#C8924A]", "text-[#9A7A5A]", "text-[#7A6045]"];

export function TopProducts() {
  const { data, isLoading, isError } = useOrders({ page: 1, limit: 200 });
  const orders = ((data as { data?: Order[] } | undefined)?.data ?? []) as Order[];

  const topProducts: TopProduct[] = Object.values(
    orders.reduce<Record<string, Omit<TopProduct, "rank" | "change">>>((acc, order) => {
      (order.items ?? []).forEach((item) => {
        const id = item.productId;
        if (!id) return;

        if (!acc[id]) {
          acc[id] = {
            id,
            name: item.productTitle ?? "Untitled product",
            category: item.productCategory?.toLowerCase() === "bedroom" ? "Bedroom" : "Kitchen",
            range: "-",
            sales: 0,
            revenue: 0,
          };
        }

        acc[id].sales += item.quantity ?? 0;
        acc[id].revenue += item.totalPrice ?? 0;
      });
      return acc;
    }, {}),
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((product, index) => ({
      ...product,
      rank: index + 1,
      change: 0,
    }));

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Top Products</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">By revenue this month</p>
        </div>
        <Link
          href="/products"
          className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-[#2E231A]">
        {isLoading ? (
          <p className="py-4 text-[13px] text-[#5A4232] text-center">Loading top products...</p>
        ) : isError ? (
          <p className="py-4 text-[13px] text-red-400 text-center">Failed to load top products.</p>
        ) : topProducts.length === 0 ? (
          <p className="py-4 text-[13px] text-[#5A4232] text-center">No product sales yet.</p>
        ) : (
          topProducts.map((product) => {
          const isPositive = product.change > 0;
          return (
            <div key={product.id} className="flex items-center gap-3 py-3 group">
              {/* Rank */}
              <span
                className={cn(
                  "shrink-0 w-5 text-[13px] font-bold leading-none tabular-nums",
                  RANK_COLORS[product.rank - 1] ?? "text-[#5A4232]"
                )}
              >
                {product.rank}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${product.id}`}
                  className="text-[13px] font-medium text-[#C8B99A] group-hover:text-[#E8D5B7] transition-colors truncate block"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      product.category === "Kitchen"
                        ? "bg-[#C8924A]/15 text-[#C8924A]"
                        : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                    )}
                  >
                    {product.category}
                  </span>
                  <span className="text-[11px] text-[#5A4232]">{product.range}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="shrink-0 text-right">
                <p className="text-[13px] font-semibold text-[#E8D5B7]">
                  £{(product.revenue / 1000).toFixed(0)}k
                </p>
                <div className="flex items-center justify-end gap-0.5 text-[11px] font-medium text-[#5A4232]">
                  {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  n/a
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}