"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Plus, Filter, MoreHorizontal,
  Pencil, Trash2, Eye, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "Kitchen" | "Bedroom";
type ProductStatus = "active" | "draft" | "archived";

interface Product {
  id: string;
  title: string;
  category: Category;
  range: string;
  colours: string[];
  price: number;
  status: ProductStatus;
  images: number;
  updatedAt: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "1", title: "Luna White",        category: "Kitchen",  range: "Luna",    colours: ["#FFFFFF","#F5F0EB","#E8E0D8"], price: 8400,  status: "active",   images: 6, updatedAt: "28 Feb 2026" },
  { id: "2", title: "Halo Oak",          category: "Bedroom",  range: "Halo",    colours: ["#C8924A","#8B6B4A","#5E4230"], price: 6200,  status: "active",   images: 4, updatedAt: "27 Feb 2026" },
  { id: "3", title: "Slate Grey Gloss",  category: "Kitchen",  range: "Slate",   colours: ["#6B7280","#4B5563","#374151"], price: 9100,  status: "active",   images: 5, updatedAt: "26 Feb 2026" },
  { id: "4", title: "Nordic Birch",      category: "Bedroom",  range: "Nordic",  colours: ["#D4B896","#C4A882","#A8896A"], price: 4800,  status: "active",   images: 3, updatedAt: "25 Feb 2026" },
  { id: "5", title: "Pebble J-Pull",     category: "Kitchen",  range: "Classic", colours: ["#9CA3AF","#6B7280"],           price: 7300,  status: "draft",    images: 2, updatedAt: "24 Feb 2026" },
  { id: "6", title: "Ash Handleless",    category: "Kitchen",  range: "Ash",     colours: ["#D1C4B0","#B8A898"],           price: 10200, status: "active",   images: 7, updatedAt: "23 Feb 2026" },
  { id: "7", title: "Linen Shaker",      category: "Bedroom",  range: "Shaker",  colours: ["#E8DDD0","#D4C8B8"],           price: 3900,  status: "archived", images: 4, updatedAt: "20 Feb 2026" },
];

const STATUS_STYLES: Record<ProductStatus, string> = {
  active:   "bg-emerald-400/10 text-emerald-400",
  draft:    "bg-[#6B8A9A]/15 text-[#6B8A9A]",
  archived: "bg-[#3D2E1E] text-[#5A4232]",
};

export function ProductTable() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ProductStatus>("All");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.range.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || p.category === categoryFilter;
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id));

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        {/* Search */}
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

        {/* Category filter */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40"
          >
            <option value="All">All Categories</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Bedroom">Bedroom</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {selected.length > 0 && (
          <span className="text-[11px] text-[#C8924A] bg-[#C8924A]/10 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
        )}

        <Link
          href="/products/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors"
        >
          <Plus size={14} />
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              <th className="px-5 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer"
                />
              </th>
              {["Product", "Category", "Colours", "Price", "Images", "Status", "Updated", ""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((product) => (
              <tr key={product.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="px-5 py-3.5">
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer"
                  />
                </td>

                {/* Product */}
                <td className="px-3 py-3.5">
                  <div>
                    <Link
                      href={`/products/${product.id}`}
                      className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors"
                    >
                      {product.title}
                    </Link>
                    <p className="text-[11px] text-[#5A4232] mt-0.5">{product.range} Range</p>
                  </div>
                </td>

                {/* Category */}
                <td className="px-3 py-3.5">
                  <span className={cn(
                    "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                    product.category === "Kitchen"
                      ? "bg-[#C8924A]/15 text-[#C8924A]"
                      : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                  )}>
                    {product.category}
                  </span>
                </td>

                {/* Colours */}
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-1">
                    {product.colours.slice(0, 4).map((hex, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-[#3D2E1E] shrink-0"
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                    {product.colours.length > 4 && (
                      <span className="text-[10px] text-[#5A4232]">+{product.colours.length - 4}</span>
                    )}
                  </div>
                </td>

                {/* Price */}
                <td className="px-3 py-3.5">
                  <span className="text-[13px] font-semibold text-[#E8D5B7]">
                    £{product.price.toLocaleString()}
                  </span>
                </td>

                {/* Images */}
                <td className="px-3 py-3.5">
                  <span className="text-[12px] text-[#7A6045]">{product.images} imgs</span>
                </td>

                {/* Status */}
                <td className="px-3 py-3.5">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium capitalize", STATUS_STYLES[product.status])}>
                    {product.status}
                  </span>
                </td>

                {/* Updated */}
                <td className="px-3 py-3.5">
                  <span className="text-[11px] text-[#5A4232]">{product.updatedAt}</span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3.5 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenu === product.id && (
                    <div className="absolute right-3 top-full mt-1 z-20 w-[150px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                      {[
                        { icon: Eye,    label: "View",   href: `/products/${product.id}` },
                        { icon: Pencil, label: "Edit",   href: `/products/${product.id}` },
                      ].map(({ icon: Icon, label, href }) => (
                        <Link key={label} href={href} onClick={() => setOpenMenu(null)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
                        >
                          <Icon size={13} /> {label}
                        </Link>
                      ))}
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#2E231A] flex items-center justify-between">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} products</span>
        <span className="text-[12px] text-[#3D2E1E]">Page 1 of 1</span>
      </div>
    </div>
  );
}