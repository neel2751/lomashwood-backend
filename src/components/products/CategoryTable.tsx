"use client";

import { useState } from "react";

import Link from "next/link";

import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: "Kitchen" | "Bedroom";
  slug: string;
  description: string;
  productCount: number;
  createdAt: string;
}

const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Kitchen",  slug: "kitchen",  description: "All kitchen furniture, cabinets, and fitted units.",  productCount: 48, createdAt: "01 Jan 2026" },
  { id: "2", name: "Bedroom",  slug: "bedroom",  description: "Fitted bedroom furniture, wardrobes, and storage.",   productCount: 31, createdAt: "01 Jan 2026" },
];

export function CategoryTable() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search categories..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]"
          />
        </div>
        <Link
          href="/products/categories/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors"
        >
          <Plus size={14} /> Add Category
        </Link>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2E231A]">
            {["Category", "Slug", "Description", "Products", "Created", ""].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2E231A]">
          {filtered.map((cat) => (
            <tr key={cat.id} className="group hover:bg-[#221A12] transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-[8px] flex items-center justify-center text-[11px] font-bold",
                    cat.name === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                  )}>
                    {cat.name[0]}
                  </div>
                  <span className="text-[13px] font-medium text-[#E8D5B7]">{cat.name}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-[12px] font-mono text-[#5A4232]">/{cat.slug}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[12.5px] text-[#7A6045] line-clamp-1 max-w-[280px]">{cat.description}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[13px] font-semibold text-[#E8D5B7]">{cat.productCount}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[11px] text-[#5A4232]">{cat.createdAt}</span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/products/categories/${cat.id}`}
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
  );
}