"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductOptionTable } from "@/components/products/ProductOptionTable";
import {
  useCreateProductFinish,
  useDeleteProductFinish,
  useProductFinishes,
  useUpdateProductFinish,
} from "@/hooks/useProductFinishes";

const SUB_NAV = [
  { href: "/products", label: "All Products" },
  { href: "/products/categories", label: "Categories" },
  { href: "/products/colours", label: "Colours" },
  { href: "/products/sizes", label: "Sizes" },
  { href: "/products/style", label: "Style" },
  { href: "/products/finish", label: "Finish" },
  { href: "/products/projects", label: "Projects" },
  { href: "/products/inventory", label: "Inventory" },
  { href: "/products/pricing", label: "Pricing" },
  { href: "/products/package", label: "Packages" },
];
export default function ProductFinishPage() {
  const query = useProductFinishes({ page: 1, limit: 200 });
  const createOption = useCreateProductFinish();
  const updateOption = useUpdateProductFinish();
  const deleteOption = useDeleteProductFinish();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Finish"
        description="Manage product finishes from database with active/inactive status."
      />

      <nav className="flex gap-2 overflow-x-auto border-b border-[#E8E6E1]">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-9 items-center whitespace-nowrap px-3 text-sm ${
              item.href === "/products/finish"
                ? "border-b-2 border-[#1A1A18] font-semibold text-[#1A1A18]"
                : "text-[#6B6B68]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <ProductOptionTable
        title="Finishes"
        query={query}
        createOption={createOption}
        updateOption={updateOption}
        deleteOption={deleteOption}
      />
    </div>
  );
}
