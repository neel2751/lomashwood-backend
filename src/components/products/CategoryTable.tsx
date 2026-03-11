"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";

interface Category {
  id: string;
  name: string;
  type?: "kitchen" | "bedroom";
  createdAt?: string;
}

interface Product {
  id: string;
  category: "kitchen" | "bedroom";
}

export function CategoryTable() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useCategories();
  const { data: productsData } = useProducts({ page: 1, limit: 200 });

  const categories = ((data as { data?: Category[] } | undefined)?.data ?? []) as Category[];
  const products = ((productsData as { data?: Product[] } | undefined)?.data ?? []) as Product[];

  const productCountByType = products.reduce<Record<string, number>>((acc, product) => {
    acc[product.category] = (acc[product.category] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = categories.filter((c) => {
    const description = c.type === "kitchen"
      ? "All kitchen furniture, cabinets, and fitted units."
      : "Fitted bedroom furniture, wardrobes, and storage.";

    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase())
    );
  });

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
            placeholder="Search categories..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#A39F96] focus:outline-none focus:border-[#C8924A] w-[200px]"
          />
        </div>
        <p className="ml-auto text-[12px] text-[#7A776F]">
          Product categories are fixed to Kitchen and Bedroom.
        </p>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E8E6E1] bg-[#FCFBF9]">
            {["Category", "Slug", "Description", "Products", "Created", ""].map((h) => (
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
                Loading categories...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-red-400">
                Failed to load categories.
              </td>
            </tr>
          ) : (
            filtered.map((cat) => (
              <tr key={cat.id} className="group hover:bg-[#FAF7F1] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-[8px] flex items-center justify-center text-[11px] font-bold",
                      cat.type === "kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]" : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                    )}>
                      {cat.name[0]}
                    </div>
                    <span className="text-[13px] font-medium text-[#2B2A28]">{cat.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[12px] font-mono text-[#8A8884]">/{cat.name.toLowerCase().replace(/\s+/g, "-")}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[12.5px] text-[#6B6B68] line-clamp-1 max-w-[280px]">
                    {cat.type === "kitchen"
                      ? "All kitchen furniture, cabinets, and fitted units."
                      : "Fitted bedroom furniture, wardrobes, and storage."}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[13px] font-semibold text-[#1A1A18]">
                    {cat.type ? (productCountByType[cat.type] ?? 0) : 0}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[11px] text-[#7A776F]">
                    {cat.createdAt
                      ? new Date(cat.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                      : "-"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/products/categories/${cat.id}`}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#8B6914] hover:text-[#6F5310] transition-colors"
                  >
                    View
                    <ArrowRight size={13} />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}