"use client";

import { useState } from "react";

import Link from "next/link";

import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useColours, useDeleteColor } from "@/hooks/useColours";
import { useProducts } from "@/hooks/useProducts";

interface Colour {
  id: string;
  name: string;
  hexCode?: string;
}

interface ProductColour {
  id: string;
}

interface Product {
  id: string;
  colours: ProductColour[];
}

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export function ColourTable() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useColours();
  const { data: productsData } = useProducts({ page: 1, limit: 200 });
  const deleteColor = useDeleteColor();

  const colours = ((data as { data?: Colour[] } | undefined)?.data ?? []) as Colour[];
  const products = ((productsData as { data?: Product[] } | undefined)?.data ?? []) as Product[];

  const colourUsage = products.reduce<Record<string, number>>((acc, product) => {
    product.colours.forEach((colour) => {
      acc[colour.id] = (acc[colour.id] ?? 0) + 1;
    });
    return acc;
  }, {});

  const filtered = colours.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.hexCode ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-[16px] bg-white border border-[#E8E6E1] overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E6E1] bg-[#FCFBF9]">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colours..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#A39F96] focus:outline-none focus:border-[#C8924A] w-[200px]"
          />
        </div>
        <Link
          href="/products/colours/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors"
        >
          <Plus size={14} /> Add Colour
        </Link>
      </div>

      {/* Grid of colour cards */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {isLoading ? (
          <p className="col-span-full text-center text-[#7A776F] text-[13px]">Loading colours...</p>
        ) : isError ? (
          <p className="col-span-full text-center text-red-400 text-[13px]">Failed to load colours.</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full text-center text-[#7A776F] text-[13px]">No colours found.</p>
        ) : (
          filtered.map((colour) => {
            const hex = colour.hexCode ?? "#C8B99A";
            return (
          <div
            key={colour.id}
              className="group rounded-[12px] border border-[#E8E6E1] overflow-hidden hover:border-[#C8924A]/40 transition-all bg-[#FFFEFC]"
          >
            {/* Swatch */}
            <div
              className="h-20 w-full relative"
              style={{ background: hex }}
            >
              {/* Hex chip */}
              <div className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${isLight(hex) ? "bg-black/15 text-black/60" : "bg-white/15 text-white/80"}`}>
                {hex.toUpperCase()}
              </div>

              {/* Action overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <Link
                  href={`/products/colours/${colour.id}`}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-all"
                >
                  <Pencil size={12} />
                </Link>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/30 hover:bg-red-500/60 text-white transition-all"
                  onClick={() => {
                    if (!confirm(`Delete colour \"${colour.name}\"?`)) return;
                    deleteColor.mutate(colour.id);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-[#FFFEFC] px-2.5 py-2 border-t border-[#EEE9DE]">
              <p className="text-[12px] font-medium text-[#2B2A28] truncate">{colour.name}</p>
              <p className="text-[10.5px] text-[#8A8884] mt-0.5">{colourUsage[colour.id] ?? 0} products</p>
            </div>
          </div>
            );
          })
        )}
      </div>

      <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FCFBF9]">
        <span className="text-[12px] text-[#7A776F]">{filtered.length} colours</span>
      </div>
    </div>
  );
}