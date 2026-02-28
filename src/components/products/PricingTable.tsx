"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type PriceType = "standard" | "sale" | "package";

interface PricingRule {
  id: string;
  productTitle: string;
  category: "Kitchen" | "Bedroom";
  size: string;
  type: PriceType;
  basePrice: number;
  salePrice: number | null;
  discount: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
}

const MOCK_PRICING: PricingRule[] = [
  { id: "1", productTitle: "Luna White",       category: "Kitchen",  size: "Standard", type: "standard", basePrice: 8400,  salePrice: null,  discount: null, validFrom: null,       validTo: null,       isActive: true  },
  { id: "2", productTitle: "Luna White",       category: "Kitchen",  size: "Large",    type: "sale",     basePrice: 9800,  salePrice: 7840,  discount: 20,   validFrom: "01 Mar",   validTo: "31 Mar",   isActive: true  },
  { id: "3", productTitle: "Halo Oak",         category: "Bedroom",  size: "Double",   type: "standard", basePrice: 6200,  salePrice: null,  discount: null, validFrom: null,       validTo: null,       isActive: true  },
  { id: "4", productTitle: "Slate Grey Gloss", category: "Kitchen",  size: "Standard", type: "package",  basePrice: 9100,  salePrice: 7735,  discount: 15,   validFrom: "01 Feb",   validTo: "30 Apr",   isActive: true  },
  { id: "5", productTitle: "Nordic Birch",     category: "Bedroom",  size: "Single",   type: "standard", basePrice: 4800,  salePrice: null,  discount: null, validFrom: null,       validTo: null,       isActive: false },
  { id: "6", productTitle: "Pebble J-Pull",    category: "Kitchen",  size: "Compact",  type: "sale",     basePrice: 7300,  salePrice: 5840,  discount: 20,   validFrom: "15 Feb",   validTo: "15 Mar",   isActive: true  },
];

const TYPE_STYLES: Record<PriceType, string> = {
  standard: "bg-[#6B8A9A]/15 text-[#6B8A9A]",
  sale:     "bg-[#C8924A]/15 text-[#C8924A]",
  package:  "bg-purple-400/10 text-purple-400",
};

export function PricingTable() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | PriceType>("All");

  const filtered = MOCK_PRICING.filter((p) => {
    const matchSearch = p.productTitle.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]"
          />
        </div>

        <div className="flex gap-1 bg-[#2E231A] rounded-[8px] p-0.5">
          {(["All", "standard", "sale", "package"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1 rounded-[6px] text-[11px] font-medium capitalize transition-all",
                typeFilter === t ? "bg-[#C8924A] text-white" : "text-[#5A4232] hover:text-[#C8924A]"
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
            <tr className="border-b border-[#2E231A]">
              {["Product", "Category", "Size", "Type", "Base Price", "Sale Price", "Discount", "Validity", "Active", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((rule) => (
              <tr key={rule.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="px-4 py-3.5">
                  <Link href={`/products/pricing/${rule.id}`} className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">
                    {rule.productTitle}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                    rule.category === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                  )}>
                    {rule.category}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] text-[#7A6045]">{rule.size}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit", TYPE_STYLES[rule.type])}>
                    {rule.type === "sale" || rule.type === "package" ? <Tag size={9} /> : null}
                    {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("text-[13px] font-semibold", rule.salePrice ? "text-[#7A6045] line-through text-[12px]" : "text-[#E8D5B7]")}>
                    £{rule.basePrice.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {rule.salePrice ? (
                    <span className="text-[13px] font-bold text-[#C8924A]">
                      £{rule.salePrice.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#3D2E1E]">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {rule.discount ? (
                    <span className="text-[12px] font-semibold text-emerald-400">{rule.discount}% off</span>
                  ) : (
                    <span className="text-[12px] text-[#3D2E1E]">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {rule.validFrom ? (
                    <span className="text-[11px] text-[#5A4232] whitespace-nowrap">
                      {rule.validFrom} – {rule.validTo}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#3D2E1E]">Always</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    "w-2 h-2 rounded-full inline-block",
                    rule.isActive ? "bg-emerald-400" : "bg-[#3D2E1E]"
                  )} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/products/pricing/${rule.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                      <Pencil size={13} />
                    </Link>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} pricing rules</span>
      </div>
    </div>
  );
}