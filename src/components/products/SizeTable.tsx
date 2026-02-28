"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SizeUnit {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: "Kitchen" | "Bedroom";
  productCount: number;
  createdAt: string;
}

const MOCK_SIZES: SizeUnit[] = [
  { id: "1", title: "Standard",     description: "Standard width unit — most common configuration.",       imageUrl: "", category: "Kitchen",  productCount: 22, createdAt: "10 Jan 2026" },
  { id: "2", title: "Large",        description: "Extended width for larger kitchen layouts.",              imageUrl: "", category: "Kitchen",  productCount: 14, createdAt: "10 Jan 2026" },
  { id: "3", title: "Compact",      description: "Ideal for smaller kitchens or galley configurations.",   imageUrl: "", category: "Kitchen",  productCount: 8,  createdAt: "12 Jan 2026" },
  { id: "4", title: "Single",       description: "Single wardrobe unit — 600mm width.",                    imageUrl: "", category: "Bedroom",  productCount: 11, createdAt: "15 Jan 2026" },
  { id: "5", title: "Double",       description: "Double wardrobe unit — 1200mm width.",                   imageUrl: "", category: "Bedroom",  productCount: 18, createdAt: "15 Jan 2026" },
  { id: "6", title: "Triple",       description: "Triple wardrobe spanning full wall — 1800mm width.",     imageUrl: "", category: "Bedroom",  productCount: 7,  createdAt: "18 Jan 2026" },
];

export function SizeTable() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"All" | "Kitchen" | "Bedroom">("All");

  const filtered = MOCK_SIZES.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || s.category === catFilter;
    return matchSearch && matchCat;
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
            placeholder="Search sizes..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]"
          />
        </div>

        {/* Cat filter pills */}
        <div className="flex gap-1 bg-[#2E231A] rounded-[8px] p-0.5">
          {(["All", "Kitchen", "Bedroom"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={cn(
                "px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all",
                catFilter === cat ? "bg-[#C8924A] text-white" : "text-[#5A4232] hover:text-[#C8924A]"
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
          <tr className="border-b border-[#2E231A]">
            {["Size / Unit", "Category", "Description", "Products", "Created", ""].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2E231A]">
          {filtered.map((size) => (
            <tr key={size.id} className="group hover:bg-[#221A12] transition-colors">
              <td className="px-5 py-3.5">
                <span className="text-[13px] font-medium text-[#E8D5B7]">{size.title}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className={cn(
                  "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                  size.category === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                )}>
                  {size.category}
                </span>
              </td>
              <td className="px-5 py-3.5 max-w-[300px]">
                <span className="text-[12.5px] text-[#7A6045] line-clamp-1">{size.description}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[13px] font-semibold text-[#E8D5B7]">{size.productCount}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[11px] text-[#5A4232]">{size.createdAt}</span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/products/sizes/${size.id}`}
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

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} sizes</span>
      </div>
    </div>
  );
}