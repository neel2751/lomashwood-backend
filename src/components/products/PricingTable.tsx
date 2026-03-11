"use client";

import { useState } from "react";

import Link from "next/link";

import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePricing, useDeletePricing } from "@/hooks/usePricing";
import { useProducts } from "@/hooks/useProducts";

type PriceType = "standard" | "sale" | "package";

interface PricingRule {
  id: string;
  productId: string;
  label: string;
  price: number;
  isDefault: boolean;
}

interface Product {
  id: string;
  title: string;
  category: "kitchen" | "bedroom";
  sizes: Array<{ id: string; title: string }>;
}

const TYPE_STYLES: Record<PriceType, string> = {
  standard: "bg-sky-100 text-sky-700",
  sale:     "bg-amber-100 text-amber-700",
  package:  "bg-violet-100 text-violet-700",
};

export function PricingTable() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | PriceType>("All");

  const { data, isLoading, isError } = usePricing();
  const { data: productsData } = useProducts({ page: 1, limit: 200 });
  const deletePricing = useDeletePricing();

  const rules = ((data as { data?: PricingRule[] } | undefined)?.data ?? []) as PricingRule[];
  const products = ((productsData as { data?: Product[] } | undefined)?.data ?? []) as Product[];
  const productMap = new Map(products.map((product) => [product.id, product]));

  const filtered = rules.filter((rule) => {
    const product = productMap.get(rule.productId);
    const type: PriceType = rule.isDefault ? "standard" : "sale";
    const matchSearch = (product?.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || type === typeFilter;
    return matchSearch && matchType;
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
            placeholder="Search products..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#A39F96] focus:outline-none focus:border-[#C8924A] w-[200px]"
          />
        </div>

        <div className="flex gap-1 bg-[#F2EEE6] rounded-[8px] p-0.5 border border-[#E4DED4]">
          {(["All", "standard", "sale", "package"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1 rounded-[6px] text-[11px] font-medium capitalize transition-all",
                typeFilter === t ? "bg-[#C8924A] text-white" : "text-[#6B6B68] hover:text-[#8B6914]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <Link
          href="/products/pricing/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors"
        >
          <Plus size={14} /> Add Pricing Rule
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FCFBF9]">
              {["Product", "Category", "Size", "Type", "Base Price", "Sale Price", "Discount", "Validity", "Active", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#7A776F]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEE9]">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-[13px] text-[#7A776F]">
                  Loading pricing rules...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-[13px] text-red-400">
                  Failed to load pricing rules.
                </td>
              </tr>
            ) : (
              filtered.map((rule) => {
                const product = productMap.get(rule.productId);
                const type: PriceType = rule.isDefault ? "standard" : "sale";
                const category = product?.category === "kitchen" ? "Kitchen" : "Bedroom";
                const size = product?.sizes[0]?.title ?? "-";
                return (
              <tr key={rule.id} className="group hover:bg-[#FAF7F1] transition-colors">
                <td className="px-4 py-3.5">
                  <Link href={`/products/pricing/${rule.id}`} className="text-[13px] font-medium text-[#2B2A28] hover:text-[#8B6914] transition-colors">
                    {product?.title ?? "Untitled product"}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                    category === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                  )}>
                    {category}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] text-[#6B6B68]">{size}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit", TYPE_STYLES[type])}>
                    {type === "sale" ? <Tag size={9} /> : null}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[13px] font-semibold text-[#1A1A18]">
                    £{rule.price.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12px] text-[#8A8884]">—</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12px] text-[#8A8884]">—</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] text-[#7A776F]">Always</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    "w-2 h-2 rounded-full inline-block",
                    "bg-emerald-400"
                  )} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/products/pricing/${rule.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-[#8B6914] hover:bg-[#F3EEE3] transition-all">
                      <Pencil size={13} />
                    </Link>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-red-600 hover:bg-red-50 transition-all"
                      onClick={() => {
                        if (!confirm(`Delete pricing rule for \"${product?.title ?? "this product"}\"?`)) return;
                        deletePricing.mutate(rule.id);
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
      </div>

      <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FCFBF9]">
        <span className="text-[12px] text-[#7A776F]">{filtered.length} pricing rules</span>
      </div>
    </div>
  );
}