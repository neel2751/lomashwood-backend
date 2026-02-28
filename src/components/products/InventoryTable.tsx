"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

interface InventoryItem {
  id: string;
  productId: string;
  productTitle: string;
  category: "Kitchen" | "Bedroom";
  size: string;
  sku: string;
  stock: number;
  reserved: number;
  minThreshold: number;
  status: StockStatus;
  updatedAt: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", productId: "1", productTitle: "Luna White",       category: "Kitchen",  size: "Standard", sku: "LW-KIT-001-STD", stock: 24,  reserved: 3,  minThreshold: 5,  status: "in_stock",     updatedAt: "28 Feb" },
  { id: "2", productId: "1", productTitle: "Luna White",       category: "Kitchen",  size: "Large",    sku: "LW-KIT-001-LRG", stock: 4,   reserved: 2,  minThreshold: 5,  status: "low_stock",    updatedAt: "28 Feb" },
  { id: "3", productId: "2", productTitle: "Halo Oak",         category: "Bedroom",  size: "Double",   sku: "LW-BED-002-DBL", stock: 0,   reserved: 0,  minThreshold: 3,  status: "out_of_stock", updatedAt: "27 Feb" },
  { id: "4", productId: "3", productTitle: "Slate Grey Gloss", category: "Kitchen",  size: "Standard", sku: "LW-KIT-003-STD", stock: 18,  reserved: 5,  minThreshold: 5,  status: "in_stock",     updatedAt: "26 Feb" },
  { id: "5", productId: "4", productTitle: "Nordic Birch",     category: "Bedroom",  size: "Single",   sku: "LW-BED-004-SNG", stock: 3,   reserved: 1,  minThreshold: 4,  status: "low_stock",    updatedAt: "25 Feb" },
  { id: "6", productId: "5", productTitle: "Pebble J-Pull",    category: "Kitchen",  size: "Compact",  sku: "LW-KIT-005-CMP", stock: 31,  reserved: 4,  minThreshold: 5,  status: "in_stock",     updatedAt: "24 Feb" },
];

const STATUS_STYLES: Record<StockStatus, string> = {
  in_stock:     "bg-emerald-400/10 text-emerald-400",
  low_stock:    "bg-amber-400/10 text-amber-400",
  out_of_stock: "bg-red-400/10 text-red-400",
};

const STATUS_LABELS: Record<StockStatus, string> = {
  in_stock:     "In Stock",
  low_stock:    "Low Stock",
  out_of_stock: "Out of Stock",
};

export function InventoryTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | StockStatus>("All");

  const filtered = MOCK_INVENTORY.filter((item) => {
    const matchSearch =
      item.productTitle.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const alerts = MOCK_INVENTORY.filter((i) => i.status !== "in_stock").length;

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Alert banner */}
      {alerts > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-400/10 border-b border-amber-400/20">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <span className="text-[12px] text-amber-400">
            {alerts} item{alerts !== 1 ? "s" : ""} need attention — low stock or out of stock
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or SKU..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[220px]"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40"
          >
            <option value="All">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Product / SKU", "Category", "Size", "Stock", "Reserved", "Available", "Status", "Updated", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((item) => {
              const available = item.stock - item.reserved;
              return (
                <tr key={item.id} className="group hover:bg-[#221A12] transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/products/inventory/${item.id}`} className="block">
                      <p className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">
                        {item.productTitle}
                      </p>
                      <p className="text-[10.5px] font-mono text-[#5A4232] mt-0.5">{item.sku}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                      item.category === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                    )}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12.5px] text-[#7A6045]">{item.size}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold text-[#E8D5B7]">{item.stock}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12.5px] text-[#7A6045]">{item.reserved}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[13px] font-semibold",
                      available <= 0 ? "text-red-400" : available <= item.minThreshold ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {available}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[item.status])}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] text-[#5A4232]">{item.updatedAt}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/products/inventory/${item.id}`}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
                    >
                      <Pencil size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} inventory records</span>
      </div>
    </div>
  );
}