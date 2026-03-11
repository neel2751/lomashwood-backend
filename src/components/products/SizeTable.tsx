"use client";

import { useState } from "react";

import Link from "next/link";

import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSizes, useDeleteSize } from "@/hooks/useSizes";
import { useProducts } from "@/hooks/useProducts";

interface SizeUnit {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
}

interface ProductSize {
  id: string;
}

interface Product {
  id: string;
  category: "kitchen" | "bedroom";
  sizes: ProductSize[];
}

export function SizeTable() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"All" | "Kitchen" | "Bedroom">("All");

  const { data, isLoading, isError } = useSizes();
  const { data: productsData } = useProducts({ page: 1, limit: 200 });
  const deleteSize = useDeleteSize();

  const sizes = ((data as { data?: SizeUnit[] } | undefined)?.data ?? []) as SizeUnit[];
  const products = ((productsData as { data?: Product[] } | undefined)?.data ?? []) as Product[];

  const sizeStats = products.reduce<Record<string, { kitchen: number; bedroom: number; total: number }>>((acc, product) => {
    product.sizes.forEach((size) => {
      if (!acc[size.id]) {
        acc[size.id] = { kitchen: 0, bedroom: 0, total: 0 };
      }
      const current = acc[size.id]!;
      current.total += 1;
      current[product.category] += 1;
    });
    return acc;
  }, {});

  const filtered = sizes.filter((s) => {
    const stats = sizeStats[s.id] ?? { kitchen: 0, bedroom: 0, total: 0 };
    const category: "Kitchen" | "Bedroom" = stats.kitchen >= stats.bedroom ? "Kitchen" : "Bedroom";
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="rounded-[16px] bg-white border border-[#E8E6E1] overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E6E1] flex-wrap bg-[#FCFBF9]">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sizes..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#A39F96] focus:outline-none focus:border-[#C8924A] w-[200px]"
          />
        </div>

        {/* Cat filter pills */}
        <div className="flex gap-1 bg-[#F2EEE6] rounded-[8px] p-0.5 border border-[#E4DED4]">
          {(["All", "Kitchen", "Bedroom"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={cn(
                "px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all",
                catFilter === cat ? "bg-[#C8924A] text-white" : "text-[#6B6B68] hover:text-[#8B6914]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <Link
          href="/products/sizes/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors"
        >
          <Plus size={14} /> Add Size
        </Link>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E8E6E1] bg-[#FCFBF9]">
            {["Size / Unit", "Category", "Description", "Products", "Created", ""].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#7A776F]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EEE9]">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#7A776F]">
                Loading sizes...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-red-400">
                Failed to load sizes.
              </td>
            </tr>
          ) : (
            filtered.map((size) => {
              const stats = sizeStats[size.id] ?? { kitchen: 0, bedroom: 0, total: 0 };
              const category: "Kitchen" | "Bedroom" = stats.kitchen >= stats.bedroom ? "Kitchen" : "Bedroom";
              return (
            <tr key={size.id} className="group hover:bg-[#FAF7F1] transition-colors">
              <td className="px-5 py-3.5">
                <span className="text-[13px] font-medium text-[#2B2A28]">{size.title}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className={cn(
                  "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                  category === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                )}>
                  {category}
                </span>
              </td>
              <td className="px-5 py-3.5 max-w-[300px]">
                <span className="text-[12.5px] text-[#6B6B68] line-clamp-1">{size.description ?? "-"}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[13px] font-semibold text-[#1A1A18]">{stats.total}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[11px] text-[#7A776F]">
                  {size.createdAt
                    ? new Date(size.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "-"}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/products/sizes/${size.id}`}
                    className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-[#8B6914] hover:bg-[#F3EEE3] transition-all">
                    <Pencil size={13} />
                  </Link>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-red-600 hover:bg-red-50 transition-all"
                    onClick={() => {
                      if (!confirm(`Delete size \"${size.title}\"?`)) return;
                      deleteSize.mutate(size.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FCFBF9]">
        <span className="text-[12px] text-[#7A776F]">{filtered.length} sizes</span>
      </div>
    </div>
  );
}