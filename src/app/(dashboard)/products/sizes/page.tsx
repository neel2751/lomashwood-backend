import { Suspense } from "react";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { SizeTable } from "@/components/products/SizeTable";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sizes & Units | Products" };

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

const SIZES = [
  {
    id: "base-600",
    name: "Base Unit 600mm",
    category: "Kitchen",
    width: 600,
    height: 870,
    depth: 560,
    productCount: 18,
    updatedAt: "2 days ago",
  },
  {
    id: "base-900",
    name: "Base Unit 900mm",
    category: "Kitchen",
    width: 900,
    height: 870,
    depth: 560,
    productCount: 14,
    updatedAt: "1 week ago",
  },
  {
    id: "wall-600",
    name: "Wall Unit 600mm",
    category: "Kitchen",
    width: 600,
    height: 720,
    depth: 320,
    productCount: 12,
    updatedAt: "3 days ago",
  },
  {
    id: "tall-600",
    name: "Tall Unit 600mm",
    category: "Kitchen",
    width: 600,
    height: 2130,
    depth: 560,
    productCount: 8,
    updatedAt: "5 days ago",
  },
  {
    id: "wardrobe-1800",
    name: "Wardrobe 1800mm",
    category: "Bedroom",
    width: 1800,
    height: 2200,
    depth: 600,
    productCount: 22,
    updatedAt: "Today",
  },
  {
    id: "wardrobe-2400",
    name: "Wardrobe 2400mm",
    category: "Bedroom",
    width: 2400,
    height: 2200,
    depth: 600,
    productCount: 16,
    updatedAt: "4 days ago",
  },
  {
    id: "bedside-500",
    name: "Bedside Table 500mm",
    category: "Bedroom",
    width: 500,
    height: 550,
    depth: 400,
    productCount: 11,
    updatedAt: "1 week ago",
  },
];

export default function SizesListPage() {
  return (
    <div className="sizes-page">
      <div className="sizes-page__topbar">
        <PageHeader
          title="Products"
          description="Manage your kitchen and bedroom product catalogue."
        />
        <Link href="/products/sizes/new" className="btn-primary">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Size
        </Link>
      </div>

      <nav className="subnav">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === "/products/sizes" ? "subnav__item--active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sizes-page__summary">
        {[
          { label: "Total Sizes", value: SIZES.length.toString() },
          {
            label: "Kitchen",
            value: SIZES.filter((s) => s.category === "Kitchen").length.toString(),
          },
          {
            label: "Bedroom",
            value: SIZES.filter((s) => s.category === "Bedroom").length.toString(),
          },
          {
            label: "Total Products",
            value: SIZES.reduce((a, s) => a + s.productCount, 0).toString(),
          },
        ].map(({ label, value }) => (
          <div key={label} className="summary-tile">
            <span className="summary-tile__label">{label}</span>
            <span className="summary-tile__value">{value}</span>
          </div>
        ))}
      </div>

      <div className="sizes-page__filters">
        <input type="search" className="filter-search" placeholder="Search sizes…" />
        <select className="filter-select" defaultValue="">
          <option value="" disabled>
            Category
          </option>
          <option value="kitchen">Kitchen</option>
          <option value="bedroom">Bedroom</option>
        </select>
        <select className="filter-select" defaultValue="name-asc">
          <option value="name-asc">Name A–Z</option>
          <option value="width-asc">Width ↑</option>
          <option value="products-desc">Most Products</option>
        </select>
      </div>

      <div className="sizes-grid">
        {SIZES.map((size) => (
          <Link key={size.id} href={`/products/sizes/${size.id}`} className="size-card">
            <div className="size-card__header">
              <span className="size-card__name">{size.name}</span>
              <span className={`size-card__cat size-card__cat--${size.category.toLowerCase()}`}>
                {size.category}
              </span>
            </div>
            <div className="size-card__dims">
              <div className="size-card__dim">
                <span className="size-card__dim-label">W</span>
                <span className="size-card__dim-value">
                  {size.width}
                  <small>mm</small>
                </span>
              </div>
              <div className="size-card__dim-sep" aria-hidden="true">
                ×
              </div>
              <div className="size-card__dim">
                <span className="size-card__dim-label">H</span>
                <span className="size-card__dim-value">
                  {size.height}
                  <small>mm</small>
                </span>
              </div>
              <div className="size-card__dim-sep" aria-hidden="true">
                ×
              </div>
              <div className="size-card__dim">
                <span className="size-card__dim-label">D</span>
                <span className="size-card__dim-value">
                  {size.depth}
                  <small>mm</small>
                </span>
              </div>
            </div>
            <div className="size-card__footer">
              <span className="size-card__count">{size.productCount} products</span>
              <span className="size-card__updated">{size.updatedAt}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="sizes-page__table-section">
        <h2 className="section-label">All sizes</h2>
        <Suspense fallback={<div className="table-skeleton" />}>
          <SizeTable />
        </Suspense>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
