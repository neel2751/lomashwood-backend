"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductOptionTable } from "@/components/products/ProductOptionTable";
import {
  useCreateProductStyle,
  useDeleteProductStyle,
  useProductStyles,
  useUpdateProductStyle,
} from "@/hooks/useProductStyles";

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

export default function ProductStylePage() {
  const query = useProductStyles({ page: 1, limit: 200 });
  const createOption = useCreateProductStyle();
  const updateOption = useUpdateProductStyle();
  const deleteOption = useDeleteProductStyle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Style"
        description="Manage product styles from database with active/inactive status."
      />

      <nav className="flex gap-2 overflow-x-auto border-b border-[#E8E6E1]">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-9 items-center whitespace-nowrap px-3 text-sm ${
              item.href === "/products/style"
                ? "border-b-2 border-[#1A1A18] font-semibold text-[#1A1A18]"
                : "text-[#6B6B68]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <ProductOptionTable
        title="Styles"
        query={query}
        createOption={createOption}
        updateOption={updateOption}
        deleteOption={deleteOption}
      />
    </div>
  );
}
