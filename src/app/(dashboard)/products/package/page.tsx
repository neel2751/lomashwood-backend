"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useDeletePackage, usePackages } from "@/hooks/usePackages";

import type { Package } from "@/types/product.types";

const SUB_NAV = [
  { href: "/products", label: "All Products" },
  { href: "/products/categories", label: "Categories" },
  { href: "/products/colours", label: "Colours" },
  { href: "/products/sizes", label: "Sizes" },
  { href: "/products/style", label: "Style" },
  { href: "/products/finish", label: "Finish" },
  { href: "/products/package", label: "Packages" },
];

function formatCurrency(value?: number) {
  if (typeof value !== "number") {
    return "Custom pricing";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PackagePage() {
  const toast = useToast();
  const packagesQuery = usePackages({ page: 1, limit: 200 });
  const deletePackage = useDeletePackage();

  const packages = ((packagesQuery.data as { data?: Package[] } | undefined)?.data ?? []) as Package[];

  const stats = [
    { label: "Total Packages", value: packages.length },
    { label: "Active", value: packages.filter((item) => item.isActive).length },
    { label: "Kitchen", value: packages.filter((item) => item.category === "kitchen").length },
    { label: "Bedroom", value: packages.filter((item) => item.category === "bedroom").length },
  ];

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete ${title}? Products linked to it will be detached.`)) {
      return;
    }

    try {
      await deletePackage.mutateAsync(id);
      toast.success("Package deleted successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete package");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packages"
        description="Manage package bundles and assign products to them during product creation and editing."
        actionLabel="Add Package"
        actionHref="/products/package/new"
      />

      <nav className="flex gap-2 overflow-x-auto border-b border-[#E8E6E1]">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-9 items-center whitespace-nowrap px-3 text-sm ${
              item.href === "/products/package"
                ? "border-b-2 border-[#1A1A18] font-semibold text-[#1A1A18]"
                : "text-[#6B6B68]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#E8E6E1] bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#8A877F]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#1A1A18]">{stat.value}</p>
          </div>
        ))}
      </div>

      {packagesQuery.isLoading ? (
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-6 text-sm text-[#6B6B68] shadow-sm">
          Loading packages...
        </div>
      ) : null}

      {packagesQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          Failed to load packages.
        </div>
      ) : null}

      {!packagesQuery.isLoading && !packagesQuery.isError ? (
        packages.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {packages.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-[#E8E6E1] bg-white shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-[#F0EDE7] px-6 py-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-[#1A1A18]">{item.title}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? "bg-[#EEF6EA] text-[#2E6B3C]" : "bg-[#F3F1EC] text-[#7A756C]"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6B68]">{item.description || "No package description added yet."}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/package/${item.id}/edit`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[#DDD8CD] px-4 text-sm font-medium text-[#1A1A18] transition hover:bg-[#F7F5F0]"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletePackage.isPending}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#FAF8F4] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8A877F]">Category</p>
                      <p className="mt-2 text-sm font-semibold text-[#1A1A18]">{capitalize(item.category)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#FAF8F4] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8A877F]">Price</p>
                      <p className="mt-2 text-sm font-semibold text-[#1A1A18]">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#FAF8F4] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8A877F]">Products</p>
                      <p className="mt-2 text-sm font-semibold text-[#1A1A18]">{item.productsCount ?? item.products?.length ?? 0}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8A877F]">Features</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.features ?? []).length > 0 ? (
                        item.features.map((feature) => (
                          <span key={feature} className="rounded-full bg-[#F7F5F0] px-3 py-1 text-xs font-medium text-[#4A4945]">
                            {feature}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[#6B6B68]">No features added.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8A877F]">Assigned Products</p>
                    <div className="mt-3 space-y-2">
                      {(item.products ?? []).length > 0 ? (
                        item.products?.slice(0, 4).map((product) => (
                          <div key={product.id} className="flex items-center justify-between rounded-xl border border-[#EEE9DF] px-4 py-3 text-sm">
                            <span className="font-medium text-[#1A1A18]">{product.title}</span>
                            <span className="text-[#6B6B68]">{capitalize(product.category)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#DDD8CD] px-4 py-4 text-sm text-[#6B6B68]">
                          No products are linked to this package yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8D3C6] bg-[#FCFBF9] p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[#1A1A18]">No packages yet</h2>
            <p className="mt-2 text-sm text-[#6B6B68]">Create your first package to group products in the catalogue.</p>
            <Link
              href="/products/package/new"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#1A1A18] px-5 text-sm font-semibold text-[#F5F0E8]"
            >
              Add Package
            </Link>
          </div>
        )
      ) : null}
    </div>
  );
}
