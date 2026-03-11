"use client";

import { useState } from "react";

import Link from "next/link";

import { Search, AlertTriangle, ChevronDown, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { useInventory } from "@/hooks/useInventory";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

interface InventoryItem {
  id: string;
  productId: string;
  product?: {
    title?: string;
    category?: "kitchen" | "bedroom";
  };
  sku: string;
  quantity: number;
  lowStockThreshold?: number;
  updatedAt?: string;
}

const STATUS_STYLES: Record<StockStatus, string> = {
  in_stock:     "bg-emerald-100 text-emerald-700",
  low_stock:    "bg-amber-100 text-amber-700",
  out_of_stock: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<StockStatus, string> = {
  in_stock:     "In Stock",
  low_stock:    "Low Stock",
  out_of_stock: "Out of Stock",
};

export function InventoryTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | StockStatus>("All");

  const { data, isLoading, isError } = useInventory();
  const items = ((data as { data?: InventoryItem[] } | undefined)?.data ?? []) as InventoryItem[];

  const filtered = items.filter((item) => {
    const threshold = item.lowStockThreshold ?? 5;
    const status: StockStatus = item.quantity <= 0 ? "out_of_stock" : item.quantity <= threshold ? "low_stock" : "in_stock";
    const matchSearch =
      (item.product?.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || status === statusFilter;
    return matchSearch && matchStatus;
  });

  const alerts = items.filter((item) => {
    const threshold = item.lowStockThreshold ?? 5;
    return item.quantity <= threshold;
  }).length;

  return (
    <div className="rounded-[16px] bg-white border border-[#E8E6E1] overflow-hidden shadow-sm">
      {/* Alert banner */}
      {alerts > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-b border-amber-200">
          <AlertTriangle size={14} className="text-amber-700 shrink-0" />
          <span className="text-[12px] text-amber-700">
            {alerts} item{alerts !== 1 ? "s" : ""} need attention — low stock or out of stock
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E6E1] flex-wrap bg-[#FCFBF9]">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or SKU..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#A39F96] focus:outline-none focus:border-[#C8924A] w-[220px]"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "All" | StockStatus)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] focus:outline-none focus:border-[#C8924A]"
          >
            <option value="All">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8884] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FCFBF9]">
              {["Product / SKU", "Category", "Size", "Stock", "Reserved", "Available", "Status", "Updated", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#7A776F]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEE9]">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-[#7A776F]">
                  Loading inventory...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-red-400">
                  Failed to load inventory.
                </td>
              </tr>
            ) : (
            filtered.map((item) => {
              const threshold = item.lowStockThreshold ?? 5;
              const status: StockStatus = item.quantity <= 0 ? "out_of_stock" : item.quantity <= threshold ? "low_stock" : "in_stock";
              const reserved = 0;
              const available = item.quantity - reserved;
              return (
                <tr key={item.id} className="group hover:bg-[#FAF7F1] transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/products/inventory/${item.id}`} className="block">
                      <p className="text-[13px] font-medium text-[#2B2A28] hover:text-[#8B6914] transition-colors">
                        {item.product?.title ?? "Untitled product"}
                      </p>
                      <p className="text-[10.5px] font-mono text-[#8A8884] mt-0.5">{item.sku}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                      item.product?.category === "kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                    )}>
                      {item.product?.category === "kitchen" ? "Kitchen" : "Bedroom"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12.5px] text-[#7A776F]">-</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold text-[#1A1A18]">{item.quantity}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12.5px] text-[#6B6B68]">{reserved}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[13px] font-semibold",
                      available <= 0 ? "text-red-400" : available <= threshold ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {available}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[status])}>
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] text-[#7A776F]">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/products/inventory/${item.id}`}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-[#8B6914] hover:bg-[#F3EEE3] transition-all"
                    >
                      <Pencil size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FCFBF9]">
        <span className="text-[12px] text-[#7A776F]">{filtered.length} inventory records</span>
      </div>
    </div>
  );
}