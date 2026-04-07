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

  const { data, isLoading, isError, isFetching, refetch } = useColours();
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
      (c.hexCode ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-[#E8E6E1] bg-[#FCFBF9] px-5 py-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colours..."
            className="h-9 w-[200px] rounded-[9px] border border-[#D9D5CD] bg-white pl-8 pr-3 text-[12.5px] text-[#2B2A28] placeholder:text-[#A39F96] focus:border-[#C8924A] focus:outline-none"
          />
        </div>
        <Link
          href="/products/colours/new"
          className="ml-auto flex h-9 items-center gap-2 rounded-[9px] bg-[#C8924A] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#B87E3E]"
        >
          <Plus size={14} /> Add Colour
        </Link>
      </div>

      {/* Grid of colour cards */}
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {isLoading ? (
          <p className="col-span-full text-center text-[13px] text-[#7A776F]">Loading colours...</p>
        ) : isError ? (
          <div className="col-span-full flex flex-col items-center gap-3 text-center">
            <p className="text-[13px] text-red-400">Failed to load colours.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-[8px] border border-[#D9D5CD] bg-white px-3 py-1.5 text-[12px] font-medium text-[#2B2A28]"
              disabled={isFetching}
            >
              {isFetching ? "Retrying..." : "Retry"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="col-span-full text-center text-[13px] text-[#7A776F]">No colours found.</p>
        ) : (
          filtered.map((colour) => {
            const hex = colour.hexCode ?? "#C8B99A";
            return (
              <div
                key={colour.id}
                className="group overflow-hidden rounded-[12px] border border-[#E8E6E1] bg-[#FFFEFC] transition-all hover:border-[#C8924A]/40"
              >
                {/* Swatch */}
                <div className="relative h-20 w-full" style={{ background: hex }}>
                  {/* Hex chip */}
                  <div
                    className={`absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${isLight(hex) ? "bg-black/15 text-black/60" : "bg-white/15 text-white/80"}`}
                  >
                    {hex.toUpperCase()}
                  </div>

                  {/* Action overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      href={`/products/colours/${colour.id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/40"
                    >
                      <Pencil size={12} />
                    </Link>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/30 text-white transition-all hover:bg-red-500/60"
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
                <div className="border-t border-[#EEE9DE] bg-[#FFFEFC] px-2.5 py-2">
                  <p className="truncate text-[12px] font-medium text-[#2B2A28]">{colour.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-[#8A8884]">
                    {colourUsage[colour.id] ?? 0} products
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[#E8E6E1] bg-[#FCFBF9] px-5 py-3">
        <span className="text-[12px] text-[#7A776F]">{filtered.length} colours</span>
      </div>
    </div>
  );
}
