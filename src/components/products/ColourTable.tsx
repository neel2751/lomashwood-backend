"use client";

import { useState } from "react";

import Link from "next/link";

import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Colour {
  id: string;
  name: string;
  hex: string;
  productCount: number;
  createdAt: string;
}

const MOCK_COLOURS: Colour[] = [
  { id: "1", name: "Pure White",     hex: "#FFFFFF", productCount: 12, createdAt: "01 Jan 2026" },
  { id: "2", name: "Warm Linen",     hex: "#F5F0EB", productCount: 8,  createdAt: "05 Jan 2026" },
  { id: "3", name: "Natural Oak",    hex: "#C8924A", productCount: 15, createdAt: "10 Jan 2026" },
  { id: "4", name: "Slate Grey",     hex: "#6B7280", productCount: 9,  createdAt: "12 Jan 2026" },
  { id: "5", name: "Midnight Blue",  hex: "#1E3A5F", productCount: 4,  createdAt: "15 Jan 2026" },
  { id: "6", name: "Sage Green",     hex: "#7A9A6B", productCount: 3,  createdAt: "18 Jan 2026" },
  { id: "7", name: "Charcoal",       hex: "#374151", productCount: 7,  createdAt: "20 Jan 2026" },
  { id: "8", name: "Blush Pink",     hex: "#E8B4A8", productCount: 2,  createdAt: "22 Jan 2026" },
];

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export function ColourTable() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_COLOURS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.hex.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A]">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colours..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]"
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
        {filtered.map((colour) => (
          <div
            key={colour.id}
            className="group rounded-[12px] border border-[#2E231A] overflow-hidden hover:border-[#C8924A]/30 transition-all"
          >
            {/* Swatch */}
            <div
              className="h-20 w-full relative"
              style={{ background: colour.hex }}
            >
              {/* Hex chip */}
              <div className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${isLight(colour.hex) ? "bg-black/15 text-black/60" : "bg-white/15 text-white/80"}`}>
                {colour.hex.toUpperCase()}
              </div>

              {/* Action overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <Link
                  href={`/products/colours/${colour.id}`}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-all"
                >
                  <Pencil size={12} />
                </Link>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/30 hover:bg-red-500/60 text-white transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-[#1C1611] px-2.5 py-2">
              <p className="text-[12px] font-medium text-[#C8B99A] truncate">{colour.name}</p>
              <p className="text-[10.5px] text-[#3D2E1E] mt-0.5">{colour.productCount} products</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} colours</span>
      </div>
    </div>
  );
}