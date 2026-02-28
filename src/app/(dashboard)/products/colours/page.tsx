import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { ColourTable } from '@/components/products/ColourTable'

export const metadata: Metadata = {
  title: 'Colours | Products',
}

const PRODUCT_SUBNAV = [
  { href: '/products', label: 'All Products' },
  { href: '/products/categories', label: 'Categories' },
  { href: '/products/colours', label: 'Colours' },
  { href: '/products/sizes', label: 'Sizes' },
  { href: '/products/inventory', label: 'Inventory' },
  { href: '/products/pricing', label: 'Pricing' },
]

const SAMPLE_COLOURS = [
  { id: 'arctic-white', name: 'Arctic White', hex: '#F8F8F6', category: 'Both', productCount: 34, updatedAt: '2 days ago' },
  { id: 'graphite-grey', name: 'Graphite Grey', hex: '#5A5A5A', category: 'Kitchen', productCount: 28, updatedAt: '1 week ago' },
  { id: 'navy-blue', name: 'Navy Blue', hex: '#1B2A4A', category: 'Bedroom', productCount: 19, updatedAt: '3 days ago' },
  { id: 'sage-green', name: 'Sage Green', hex: '#7B9E87', category: 'Kitchen', productCount: 22, updatedAt: '5 days ago' },
  { id: 'cashmere', name: 'Cashmere', hex: '#D4C5B0', category: 'Both', productCount: 41, updatedAt: 'Today' },
  { id: 'midnight-black', name: 'Midnight Black', hex: '#1A1A18', category: 'Both', productCount: 38, updatedAt: '4 days ago' },
  { id: 'warm-oak', name: 'Warm Oak', hex: '#C8A87A', category: 'Bedroom', productCount: 15, updatedAt: '1 week ago' },
  { id: 'dusky-pink', name: 'Dusky Pink', hex: '#D4A5A0', category: 'Bedroom', productCount: 11, updatedAt: '2 weeks ago' },
]

export default function ColoursListPage() {
  return (
    <div className="colours-page">
      <div className="colours-page__topbar">
        <PageHeader
          title="Products"
          description="Manage your kitchen and bedroom product catalogue."
        />
        <Link href="/products/colours/new" className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Colour
        </Link>
      </div>

      <nav className="subnav">
        {PRODUCT_SUBNAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === '/products/colours' ? ' subnav__item--active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="colours-page__summary">
        {[
          { label: 'Total Colours', value: SAMPLE_COLOURS.length.toString() },
          { label: 'Kitchen', value: SAMPLE_COLOURS.filter(c => c.category === 'Kitchen' || c.category === 'Both').length.toString() },
          { label: 'Bedroom', value: SAMPLE_COLOURS.filter(c => c.category === 'Bedroom' || c.category === 'Both').length.toString() },
          { label: 'Most Used', value: 'Cashmere' },
        ].map(({ label, value }) => (
          <div key={label} className="summary-tile">
            <span className="summary-tile__label">{label}</span>
            <span className="summary-tile__value">{value}</span>
          </div>
        ))}
      </div>

      <div className="colours-page__filters">
        <input type="search" className="filter-search" placeholder="Search colours…" />
        <select className="filter-select" defaultValue="">
          <option value="" disabled>Category</option>
          <option value="kitchen">Kitchen</option>
          <option value="bedroom">Bedroom</option>
          <option value="both">Both</option>
        </select>
        <select className="filter-select" defaultValue="name-asc">
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="products-desc">Most Products</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>

      <div className="colours-swatch-grid">
        {SAMPLE_COLOURS.map((colour) => (
          <Link key={colour.id} href={`/products/colours/${colour.id}`} className="swatch-card">
            <div className="swatch-card__colour" style={{ background: colour.hex }}>
              <span className="swatch-card__hex">{colour.hex}</span>
            </div>
            <div className="swatch-card__body">
              <div className="swatch-card__row">
                <span className="swatch-card__name">{colour.name}</span>
                <span className={`swatch-card__cat swatch-card__cat--${colour.category.toLowerCase().replace(' ', '-')}`}>
                  {colour.category}
                </span>
              </div>
              <div className="swatch-card__meta">
                <span>{colour.productCount} products</span>
                <span className="swatch-card__dot" aria-hidden="true">·</span>
                <span>{colour.updatedAt}</span>
              </div>
            </div>
          </Link>
        ))}

        <Link href="/products/colours/new" className="swatch-card swatch-card--new">
          <div className="swatch-card__new-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="swatch-card__new-label">Add colour</span>
        </Link>
      </div>

      <div className="colours-page__table-section">
        <h2 className="section-label">All colours</h2>
        <Suspense fallback={<div className="table-skeleton" />}>
          <ColourTable />
        </Suspense>
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

        .colours-page__filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
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
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
        }

        .filter-search::placeholder { color: #B8B5AE; }

        .filter-select {
          height: 38px;
          padding: 0 34px 0 12px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #1A1A18;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .filter-select:focus { border-color: #8B6914; }

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

        .section-label {
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
          margin-bottom: 12px;
        }

        .table-skeleton {
          height: 320px;
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
  )
}