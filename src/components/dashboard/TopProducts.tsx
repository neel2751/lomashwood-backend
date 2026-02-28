"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { id: "1", rank: 1, name: "Luna White",      category: "Kitchen",  range: "Luna",    sales: 38, revenue: 114000, change: 12.4 },
  { id: "2", rank: 2, name: "Halo Oak",         category: "Bedroom",  range: "Halo",    sales: 29, revenue: 87000,  change: 8.1  },
  { id: "3", rank: 3, name: "Slate Grey Gloss", category: "Kitchen",  range: "Slate",   sales: 24, revenue: 72000,  change: -3.2 },
  { id: "4", rank: 4, name: "Nordic Birch",     category: "Bedroom",  range: "Nordic",  sales: 18, revenue: 54000,  change: 5.6  },
  { id: "5", rank: 5, name: "Pebble J-Pull",    category: "Kitchen",  range: "Classic", sales: 15, revenue: 45000,  change: -1.8 },
];

const RANK_COLORS = ["text-[#C8924A]", "text-[#9A7A5A]", "text-[#7A6045]"];

export function TopProducts() {
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
        {MOCK_TOP_PRODUCTS.map((product) => {
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
                <div
                  className={cn(
                    "flex items-center justify-end gap-0.5 text-[11px] font-medium",
                    isPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isPositive ? "+" : ""}{product.change}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}