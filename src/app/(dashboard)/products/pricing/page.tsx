import { Suspense } from 'react'

import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { PricingTable } from '@/components/products/PricingTable'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pricing | Products' }

const PRODUCT_SUBNAV = [
  { href: '/products', label: 'All Products' },
  { href: '/products/categories', label: 'Categories' },
  { href: '/products/colours', label: 'Colours' },
  { href: '/products/sizes', label: 'Sizes' },
  { href: '/products/inventory', label: 'Inventory' },
  { href: '/products/pricing', label: 'Pricing' },
]

export default function PricingListPage() {
  return (
    <div className="pricing-page">
      <div className="pricing-page__topbar">
        <PageHeader
          title="Products"
          description="Manage your kitchen and bedroom product catalogue."
        />
        <div className="pricing-page__actions">
          <Link href="/products/pricing/new" className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Price Rule
          </Link>
        </div>
      </div>

      <nav className="subnav">
        {PRODUCT_SUBNAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === '/products/pricing' ? ' subnav__item--active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="pricing-page__summary">
        {[
          { label: 'Price Rules', value: '28', sub: 'active' },
          { label: 'Avg. Kitchen Price', value: '£8,200', sub: 'across 142 products' },
          { label: 'Avg. Bedroom Price', value: '£4,650', sub: 'across 142 products' },
          { label: 'On Sale', value: '14', sub: 'products discounted', color: '#D4820A' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="summary-tile">
            <span className="summary-tile__label">{label}</span>
            <span className="summary-tile__value" style={color ? { color } : {}}>{value}</span>
            <span className="summary-tile__sub">{sub}</span>
          </div>
        ))}
      </div>

      <div className="pricing-page__filters">
        <input type="search" className="filter-search" placeholder="Search products or rules…" />
        <select className="filter-select" defaultValue="">
          <option value="" disabled>Category</option>
          <option value="kitchen">Kitchen</option>
          <option value="bedroom">Bedroom</option>
        </select>
        <select className="filter-select" defaultValue="">
          <option value="" disabled>Price range</option>
          <option value="0-2000">Under £2,000</option>
          <option value="2000-5000">£2,000 – £5,000</option>
          <option value="5000-10000">£5,000 – £10,000</option>
          <option value="10000+">Over £10,000</option>
        </select>
        <select className="filter-select" defaultValue="price-asc">
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="name-asc">Name A–Z</option>
          <option value="updated">Recently updated</option>
        </select>
      </div>

      <Suspense fallback={<div className="table-skeleton" />}>
        <PricingTable />
      </Suspense>

      <style>{`
        .pricing-page { display: flex; flex-direction: column; gap: 24px; }

        .pricing-page__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .pricing-page__actions { padding-top: 4px; }

        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .btn-primary:hover { background: #2E2E2A; }

        .subnav { display: flex; gap: 2px; border-bottom: 1.5px solid #E8E6E1; overflow-x: auto; }
        .subnav__item { height: 38px; padding: 0 14px; display: flex; align-items: center; font-size: 0.875rem; font-weight: 500; color: #6B6B68; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; white-space: nowrap; transition: color 0.15s; }
        .subnav__item:hover { color: #1A1A18; }
        .subnav__item--active { color: #1A1A18; font-weight: 600; border-bottom-color: #1A1A18; }

        .pricing-page__summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 900px) { .pricing-page__summary { grid-template-columns: repeat(2, 1fr); } }

        .summary-tile { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 12px; padding: 16px 20px; display: flex; flex-direction: column; gap: 3px; }
        .summary-tile__label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }
        .summary-tile__value { font-size: 1.75rem; font-weight: 700; color: #1A1A18; font-variant-numeric: tabular-nums; line-height: 1.1; }
        .summary-tile__sub { font-size: 0.75rem; color: #B8B5AE; }

        .pricing-page__filters { display: flex; gap: 10px; flex-wrap: wrap; }
        .filter-search { height: 38px; padding: 0 14px; border: 1.5px solid #E8E6E1; border-radius: 8px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; outline: none; min-width: 220px; transition: border-color 0.15s; }
        .filter-search:focus { border-color: #8B6914; box-shadow: 0 0 0 3px rgba(139,105,20,0.1); }
        .filter-search::placeholder { color: #B8B5AE; }
        .filter-select { height: 38px; padding: 0 34px 0 12px; border: 1.5px solid #E8E6E1; border-radius: 8px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; transition: border-color 0.15s; }
        .filter-select:focus { border-color: #8B6914; }

        .table-skeleton { height: 480px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}