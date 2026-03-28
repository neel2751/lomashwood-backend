import { Suspense } from "react";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductTable } from "@/components/products/ProductTable";
import { ExportButton } from "@/components/shared/ExportButton";
import prisma from "@/lib/prisma";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
};

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

export default async function ProductsListPage() {
  const [totalProducts, kitchenProducts, bedroomProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { category: "kitchen" } }),
    prisma.product.count({ where: { category: "bedroom" } }),
  ]);

  const stats = [
    { label: "Total Products", value: totalProducts.toString() },
    { label: "Kitchens", value: kitchenProducts.toString() },
    { label: "Bedrooms", value: bedroomProducts.toString() },
  ];

  return (
    <div className="products-page">
      <div className="products-page__topbar">
        <PageHeader
          title="Products"
          description="Manage your kitchen and bedroom product catalogue."
        />
        <div className="products-page__actions">
          <ExportButton label="Export" />
          <Link href="/products/new" className="btn-primary">
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
            Add Product
          </Link>
        </div>
      </div>

      <nav className="sub-nav">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sub-nav__item${item.href === "/products" ? "sub-nav__item--active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="products-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-tile">
            <span className="stat-tile__label">{s.label}</span>
            <span className="stat-tile__value">{s.value}</span>
          </div>
        ))}
      </div>

      <Suspense fallback={<div className="table-skeleton" />}>
        <ProductTable />
      </Suspense>

      <style>{`
        .products-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .products-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .products-page__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding-top: 4px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 16px;
          background: #1A1A18;
          color: #F5F0E8;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }

        .btn-primary:hover { background: #2E2E2A; }

        .sub-nav {
          display: flex;
          gap: 2px;
          border-bottom: 1.5px solid #E8E6E1;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .sub-nav::-webkit-scrollbar { display: none; }

        .sub-nav__item {
          height: 38px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6B6B68;
          text-decoration: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1.5px;
          white-space: nowrap;
          transition: color 0.15s, border-color 0.15s;
        }

        .sub-nav__item:hover { color: #1A1A18; }

        .sub-nav__item--active {
          color: #1A1A18;
          border-bottom-color: #1A1A18;
          font-weight: 600;
        }

        .products-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 900px) {
          .products-stats { grid-template-columns: repeat(2, 1fr); }
        }

        .stat-tile {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-tile__label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .stat-tile__value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1A1A18;
          font-variant-numeric: tabular-nums;
        }

        .products-page__filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-left {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-right {
          display: flex;
          gap: 4px;
        }

        .filter-search {
          height: 38px;
          padding: 0 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #1A1A18;
          outline: none;
          transition: border-color 0.15s;
          min-width: 220px;
        }

        .filter-search:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.1);
        }

        .filter-search::placeholder { color: #B8B5AE; }

        .filter-select {
          height: 38px;
          padding: 0 32px 0 12px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          background: #FFFFFF;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #1A1A18;
          outline: none;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .filter-select:focus { border-color: #8B6914; }

        .view-toggle {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          color: #6B6B68;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }

        .view-toggle:hover { border-color: #1A1A18; color: #1A1A18; }

        .view-toggle--active {
          background: #1A1A18;
          border-color: #1A1A18;
          color: #F5F0E8;
        }

        .table-skeleton {
          height: 480px;
          border-radius: 12px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export const dynamic = "force-dynamic";
