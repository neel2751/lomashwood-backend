import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { SizeTable } from '@/components/products/SizeTable'

export const metadata: Metadata = { title: 'Sizes & Units | Products' }

const PRODUCT_SUBNAV = [
  { href: '/products', label: 'All Products' },
  { href: '/products/categories', label: 'Categories' },
  { href: '/products/colours', label: 'Colours' },
  { href: '/products/sizes', label: 'Sizes' },
  { href: '/products/inventory', label: 'Inventory' },
  { href: '/products/pricing', label: 'Pricing' },
]

const SIZES = [
  { id: 'base-600', name: 'Base Unit 600mm', category: 'Kitchen', width: 600, height: 870, depth: 560, productCount: 18, updatedAt: '2 days ago' },
  { id: 'base-900', name: 'Base Unit 900mm', category: 'Kitchen', width: 900, height: 870, depth: 560, productCount: 14, updatedAt: '1 week ago' },
  { id: 'wall-600', name: 'Wall Unit 600mm', category: 'Kitchen', width: 600, height: 720, depth: 320, productCount: 12, updatedAt: '3 days ago' },
  { id: 'tall-600', name: 'Tall Unit 600mm', category: 'Kitchen', width: 600, height: 2130, depth: 560, productCount: 8, updatedAt: '5 days ago' },
  { id: 'wardrobe-1800', name: 'Wardrobe 1800mm', category: 'Bedroom', width: 1800, height: 2200, depth: 600, productCount: 22, updatedAt: 'Today' },
  { id: 'wardrobe-2400', name: 'Wardrobe 2400mm', category: 'Bedroom', width: 2400, height: 2200, depth: 600, productCount: 16, updatedAt: '4 days ago' },
  { id: 'bedside-500', name: 'Bedside Table 500mm', category: 'Bedroom', width: 500, height: 550, depth: 400, productCount: 11, updatedAt: '1 week ago' },
]

export default function SizesListPage() {
  return (
    <div className="sizes-page">
      <div className="sizes-page__topbar">
        <PageHeader
          title="Products"
          description="Manage your kitchen and bedroom product catalogue."
        />
        <Link href="/products/sizes/new" className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Size
        </Link>
      </div>

      <nav className="subnav">
        {PRODUCT_SUBNAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === '/products/sizes' ? ' subnav__item--active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sizes-page__summary">
        {[
          { label: 'Total Sizes', value: SIZES.length.toString() },
          { label: 'Kitchen', value: SIZES.filter(s => s.category === 'Kitchen').length.toString() },
          { label: 'Bedroom', value: SIZES.filter(s => s.category === 'Bedroom').length.toString() },
          { label: 'Total Products', value: SIZES.reduce((a, s) => a + s.productCount, 0).toString() },
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
          <option value="" disabled>Category</option>
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
                <span className="size-card__dim-value">{size.width}<small>mm</small></span>
              </div>
              <div className="size-card__dim-sep" aria-hidden="true">×</div>
              <div className="size-card__dim">
                <span className="size-card__dim-label">H</span>
                <span className="size-card__dim-value">{size.height}<small>mm</small></span>
              </div>
              <div className="size-card__dim-sep" aria-hidden="true">×</div>
              <div className="size-card__dim">
                <span className="size-card__dim-label">D</span>
                <span className="size-card__dim-value">{size.depth}<small>mm</small></span>
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

      <style>{`
        .sizes-page { display: flex; flex-direction: column; gap: 24px; }

        .sizes-page__topbar {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px;
          background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600;
          text-decoration: none; cursor: pointer; transition: background 0.15s; white-space: nowrap;
          flex-shrink: 0; margin-top: 4px;
        }
        .btn-primary:hover { background: #2E2E2A; }

        .subnav { display: flex; gap: 2px; border-bottom: 1.5px solid #E8E6E1; overflow-x: auto; }

        .subnav__item {
          height: 38px; padding: 0 14px; display: flex; align-items: center;
          font-size: 0.875rem; font-weight: 500; color: #6B6B68; text-decoration: none;
          border-bottom: 2px solid transparent; margin-bottom: -1.5px; white-space: nowrap;
          transition: color 0.15s, border-color 0.15s;
        }
        .subnav__item:hover { color: #1A1A18; }
        .subnav__item--active { color: #1A1A18; font-weight: 600; border-bottom-color: #1A1A18; }

        .sizes-page__summary {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
        }
        @media (max-width: 900px) { .sizes-page__summary { grid-template-columns: repeat(2, 1fr); } }

        .summary-tile {
          background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 12px;
          padding: 16px 20px; display: flex; flex-direction: column; gap: 4px;
        }
        .summary-tile__label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }
        .summary-tile__value { font-size: 1.5rem; font-weight: 700; color: #1A1A18; font-variant-numeric: tabular-nums; }

        .sizes-page__filters { display: flex; gap: 10px; flex-wrap: wrap; }

        .filter-search {
          height: 38px; padding: 0 14px; border: 1.5px solid #E8E6E1; border-radius: 8px;
          background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; color: #1A1A18; outline: none; transition: border-color 0.15s; min-width: 220px;
        }
        .filter-search:focus { border-color: #8B6914; box-shadow: 0 0 0 3px rgba(139,105,20,0.1); }
        .filter-search::placeholder { color: #B8B5AE; }

        .filter-select {
          height: 38px; padding: 0 34px 0 12px; border: 1.5px solid #E8E6E1; border-radius: 8px;
          background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem;
          color: #1A1A18; cursor: pointer; outline: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; transition: border-color 0.15s;
        }
        .filter-select:focus { border-color: #8B6914; }

        .sizes-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        @media (max-width: 1100px) { .sizes-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .sizes-grid { grid-template-columns: 1fr; } }

        .size-card {
          display: flex; flex-direction: column; gap: 14px; padding: 18px 20px;
          background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px;
          text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .size-card:hover {
          border-color: #C9A84C; box-shadow: 0 4px 16px rgba(139,105,20,0.1); transform: translateY(-2px);
        }

        .size-card__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .size-card__name { font-size: 0.9375rem; font-weight: 600; color: #1A1A18; }

        .size-card__cat {
          font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em;
          text-transform: uppercase; padding: 2px 7px; border-radius: 20px; flex-shrink: 0;
        }
        .size-card__cat--kitchen  { color: #2980B9; background: #EBF4FB; }
        .size-card__cat--bedroom  { color: #8B6914; background: #FFF8E6; }

        .size-card__dims {
          display: flex; align-items: center; gap: 10px;
          background: #F7F5F0; border-radius: 10px; padding: 12px 16px;
        }

        .size-card__dim { display: flex; flex-direction: column; gap: 2px; align-items: center; flex: 1; }
        .size-card__dim-label { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6B6B68; }
        .size-card__dim-value {
          font-family: 'DM Mono', monospace; font-size: 1rem; font-weight: 600; color: #1A1A18;
        }
        .size-card__dim-value small { font-size: 0.6875rem; color: #6B6B68; margin-left: 1px; }
        .size-card__dim-sep { color: #B8B5AE; font-size: 1rem; flex-shrink: 0; }

        .size-card__footer { display: flex; align-items: center; justify-content: space-between; }
        .size-card__count { font-size: 0.8125rem; color: #6B6B68; }
        .size-card__updated { font-size: 0.75rem; color: #B8B5AE; }

        .section-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; margin-bottom: 12px; }

        .table-skeleton {
          height: 320px; border-radius: 12px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}