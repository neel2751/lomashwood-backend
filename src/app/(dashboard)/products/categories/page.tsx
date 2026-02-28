import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { CategoryTable } from '@/components/products/CategoryTable'

export const metadata: Metadata = {
  title: 'Categories | Products',
}

const SUB_NAV = [
  { href: '/products',            label: 'All Products' },
  { href: '/products/categories', label: 'Categories' },
  { href: '/products/colours',    label: 'Colours' },
  { href: '/products/sizes',      label: 'Sizes' },
  { href: '/products/inventory',  label: 'Inventory' },
  { href: '/products/pricing',    label: 'Pricing' },
]

const CATEGORIES = [
  { id: 'kitchen', label: 'Kitchen', count: 96, icon: '🍳', desc: 'Full kitchen ranges, units, and accessories' },
  { id: 'bedroom', label: 'Bedroom', count: 88, icon: '🛏', desc: 'Fitted wardrobes, storage, and bedroom furniture' },
]

export default function CategoriesListPage() {
  return (
    <div className="categories-page">
      <div className="categories-page__topbar">
        <PageHeader
          title="Categories"
          description="Manage the top-level product categories used across the catalogue."
          backHref="/products"
          backLabel="Products"
        />
        <Link href="/products/categories/new" className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Category
        </Link>
      </div>

      <nav className="sub-nav">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sub-nav__item${item.href === '/products/categories' ? ' sub-nav__item--active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="categories-overview">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/products/categories/${cat.id}`}
            className="cat-overview-card"
          >
            <span className="cat-overview-card__icon">{cat.icon}</span>
            <div className="cat-overview-card__body">
              <span className="cat-overview-card__name">{cat.label}</span>
              <span className="cat-overview-card__desc">{cat.desc}</span>
            </div>
            <div className="cat-overview-card__count">
              <span className="cat-overview-card__count-value">{cat.count}</span>
              <span className="cat-overview-card__count-label">products</span>
            </div>
            <svg className="cat-overview-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>

      <div className="categories-page__filters">
        <input
          type="search"
          className="filter-search"
          placeholder="Search categories…"
        />
      </div>

      <Suspense fallback={<div className="table-skeleton" />}>
        <CategoryTable />
      </Suspense>

      <style>{`
        .categories-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .categories-page__topbar {
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

        .categories-overview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (max-width: 640px) {
          .categories-overview { grid-template-columns: 1fr; }
        }

        .cat-overview-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }

        .cat-overview-card:hover {
          border-color: #C9A84C;
          box-shadow: 0 4px 16px rgba(139,105,20,0.08);
          transform: translateY(-1px);
        }

        .cat-overview-card__icon {
          font-size: 1.75rem;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F7F5F0;
          border-radius: 12px;
          border: 1px solid #E8E0D0;
        }

        .cat-overview-card__body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cat-overview-card__name {
          font-size: 1rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .cat-overview-card__desc {
          font-size: 0.8125rem;
          color: #6B6B68;
        }

        .cat-overview-card__count {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .cat-overview-card__count-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #8B6914;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }

        .cat-overview-card__count-label {
          font-size: 0.75rem;
          color: #6B6B68;
          font-weight: 500;
        }

        .cat-overview-card__arrow {
          color: #B8B5AE;
          flex-shrink: 0;
          transition: color 0.15s, transform 0.15s;
        }

        .cat-overview-card:hover .cat-overview-card__arrow {
          color: #8B6914;
          transform: translateX(2px);
        }

        .categories-page__filters {
          display: flex;
          gap: 10px;
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
          min-width: 240px;
        }

        .filter-search:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.1);
        }

        .filter-search::placeholder { color: #B8B5AE; }

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