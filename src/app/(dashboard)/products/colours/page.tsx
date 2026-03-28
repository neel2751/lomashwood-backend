import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import prisma from "@/lib/prisma";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Colours | Products",
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

type ColourCategory = "Kitchen" | "Bedroom" | "Both";

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ColoursListPage() {
  const rawColours = await prisma.colour.findMany({
    include: {
      products: {
        include: {
          product: {
            select: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  const colours = rawColours.map((colour) => {
    const categories = new Set(colour.products.map((entry) => entry.product.category));
    const hasKitchen = categories.has("kitchen");
    const hasBedroom = categories.has("bedroom");

    let category: ColourCategory = "Both";
    if (hasKitchen && !hasBedroom) {
      category = "Kitchen";
    } else if (!hasKitchen && hasBedroom) {
      category = "Bedroom";
    }

    return {
      id: colour.id,
      name: colour.name,
      hex: colour.hexCode,
      category,
      productCount: colour.products.length,
      updatedAt: formatUpdatedAt(colour.updatedAt),
      isFeatured: colour.isFeatured,
    };
  });

  const kitchenCount = colours.filter(
    (colour) => colour.category === "Kitchen" || colour.category === "Both",
  ).length;
  const bedroomCount = colours.filter(
    (colour) => colour.category === "Bedroom" || colour.category === "Both",
  ).length;
  const mostUsedColour = colours.reduce<(typeof colours)[number] | null>((top, current) => {
    if (!top || current.productCount > top.productCount) {
      return current;
    }
    return top;
  }, null);

  return (
    <div className="colours-page">
      <div className="colours-page__topbar">
        <PageHeader
          title="Products"
          description="Manage your kitchen and bedroom product catalogue."
        />
        <Link href="/products/colours/new" className="btn-primary">
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
          Add Colour
        </Link>
      </div>

      <nav className="subnav">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === "/products/colours" ? "subnav__item--active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="colours-page__summary">
        {[
          { label: "Total Colours", value: colours.length.toString() },
          { label: "Kitchen", value: kitchenCount.toString() },
          { label: "Bedroom", value: bedroomCount.toString() },
          { label: "Most Used", value: mostUsedColour?.name ?? "-" },
        ].map(({ label, value }) => (
          <div key={label} className="summary-tile">
            <span className="summary-tile__label">{label}</span>
            <span className="summary-tile__value">{value}</span>
          </div>
        ))}
      </div>

      <div className="colours-swatch-grid">
        {colours.map((colour) => (
          <Link key={colour.id} href={`/products/colours/${colour.id}`} className="swatch-card">
            <div className="swatch-card__colour" style={{ background: colour.hex }}>
              <span className="swatch-card__hex">{colour.hex}</span>
            </div>
            <div className="swatch-card__body">
              <div className="swatch-card__row">
                <div className="swatch-card__title">
                  <span className="swatch-card__name">{colour.name}</span>
                  {colour.isFeatured ? (
                    <span className="swatch-card__featured">Featured</span>
                  ) : null}
                </div>
                <span
                  className={`swatch-card__cat swatch-card__cat--${colour.category.toLowerCase().replace(" ", "-")}`}
                >
                  {colour.category}
                </span>
              </div>
              <div className="swatch-card__meta">
                <span>{colour.productCount} products</span>
                <span className="swatch-card__dot" aria-hidden="true">
                  ·
                </span>
                <span>{colour.updatedAt}</span>
              </div>
            </div>
          </Link>
        ))}

        <Link href="/products/colours/new" className="swatch-card swatch-card--new">
          <div className="swatch-card__new-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="swatch-card__new-label">Add colour</span>
        </Link>
      </div>

      <style>{`
        .colours-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .colours-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
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
          flex-shrink: 0;
          margin-top: 4px;
        }

        .btn-primary:hover { background: #2E2E2A; }

        .subnav {
          display: flex;
          gap: 2px;
          border-bottom: 1.5px solid #E8E6E1;
          overflow-x: auto;
        }

        .subnav__item {
          height: 38px;
          padding: 0 14px;
          display: flex;
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

        .subnav__item:hover { color: #1A1A18; }

        .subnav__item--active {
          color: #1A1A18;
          font-weight: 600;
          border-bottom-color: #1A1A18;
        }

        .colours-page__summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 900px) { .colours-page__summary { grid-template-columns: repeat(2, 1fr); } }

        .summary-tile {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-tile__label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .summary-tile__value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A1A18;
          font-variant-numeric: tabular-nums;
        }

        .colours-swatch-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 1100px) { .colours-swatch-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px)  { .colours-swatch-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .colours-swatch-grid { grid-template-columns: 1fr; } }

        .swatch-card {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          overflow: hidden;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }

        .swatch-card:hover {
          border-color: #C9A84C;
          box-shadow: 0 4px 16px rgba(139, 105, 20, 0.1);
          transform: translateY(-2px);
        }

        .swatch-card__colour {
          height: 90px;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding: 8px 10px;
        }

        .swatch-card__hex {
          font-family: 'DM Mono', monospace;
          font-size: 0.6875rem;
          color: rgba(255,255,255,0.7);
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .swatch-card:hover .swatch-card__hex { opacity: 1; }

        .swatch-card__body {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .swatch-card__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .swatch-card__name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .swatch-card__title {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .swatch-card__featured {
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #8B6914;
          background: #FFF3D4;
          border: 1px solid #E8D9B8;
          border-radius: 20px;
          padding: 2px 6px;
          flex-shrink: 0;
        }

        .swatch-card__cat {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 20px;
          flex-shrink: 0;
        }

        .swatch-card__cat--kitchen  { color: #2980B9; background: #EBF4FB; }
        .swatch-card__cat--bedroom  { color: #8B6914; background: #FFF8E6; }
        .swatch-card__cat--both     { color: #27AE60; background: #EAF7EF; }

        .swatch-card__meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #6B6B68;
        }

        .swatch-card__dot { color: #B8B5AE; }

        .swatch-card--new {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 160px;
          background: #FAFAF8;
          border-style: dashed;
          color: #B8B5AE;
        }

        .swatch-card--new:hover {
          border-color: #8B6914;
          color: #8B6914;
          background: #FFFDF7;
          box-shadow: none;
        }

        .swatch-card__new-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          color: inherit;
          opacity: 0.15;
        }

        .swatch-card--new:hover .swatch-card__new-icon { opacity: 1; background: #FFF3D4; color: #8B6914; }

        .swatch-card__new-label {
          font-size: 0.875rem;
          font-weight: 500;
        }

      `}</style>
    </div>
  );
}

export const dynamic = "force-dynamic";
