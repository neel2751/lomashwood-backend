import { Suspense } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductTable } from '@/components/products/ProductTable'

import type { Metadata } from 'next'

type Props = { params: { id: string } }

type Category = {
  id: string
  name: string
  type: 'kitchen' | 'bedroom'
  description: string
  slug: string
  productCount: number
  createdAt: string
  updatedAt: string
}

const MOCK_CATEGORIES: Record<string, Category> = {
  kitchen: {
    id: 'kitchen',
    name: 'Kitchen',
    type: 'kitchen',
    description: 'Full kitchen ranges, units, handles, and accessories.',
    slug: 'kitchen',
    productCount: 96,
    createdAt: '1 Jan 2024',
    updatedAt: '2 days ago',
  },
  bedroom: {
    id: 'bedroom',
    name: 'Bedroom',
    type: 'bedroom',
    description: 'Fitted wardrobes, storage solutions, and bedroom furniture.',
    slug: 'bedroom',
    productCount: 88,
    createdAt: '1 Jan 2024',
    updatedAt: '5 days ago',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = MOCK_CATEGORIES[params.id]
  return {
    title: category ? `${category.name} | Categories` : 'Category | Products',
  }
}

export default function CategoryDetailPage({ params }: Props) {
  const category = MOCK_CATEGORIES[params.id]
  if (!category) notFound()

  const typeLabel = category.type === 'kitchen' ? '🍳 Kitchen' : '🛏 Bedroom'

  return (
    <div className="cat-detail">
      <div className="cat-detail__topbar">
        <PageHeader
          title={category.name}
          description={`${typeLabel} · ${category.productCount} products`}
          backHref="/products/categories"
          backLabel="Categories"
        />
        <div className="cat-detail__actions">
          <button className="btn-danger-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
          <Link href={`/products/categories/${params.id}/edit`} className="btn-primary">
            Edit Category
          </Link>
        </div>
      </div>

      <div className="cat-detail__layout">
        <div className="cat-detail__main">
          <div className="detail-card">
            <h2 className="detail-card__title">Category Details</h2>
            <dl className="detail-grid">
              {[
                { label: 'Name',        value: category.name },
                { label: 'Type',        value: typeLabel },
                { label: 'Description', value: category.description },
                { label: 'URL Slug',    value: `/products/${category.slug}`, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="detail-row">
                  <dt className="detail-label">{label}</dt>
                  <dd className={`detail-value${mono ? ' detail-value--mono' : ''}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="detail-card">
            <div className="detail-card__header">
              <h2 className="detail-card__title">Products in this Category</h2>
              <Link href={`/products/new?category=${category.type}`} className="btn-sm-primary">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Product
              </Link>
            </div>
            <Suspense fallback={<div className="table-skeleton" />}>
              <ProductTable categoryFilter={category.type} />
            </Suspense>
          </div>
        </div>

        <aside className="cat-detail__sidebar">
          <div className="sidebar-stat-card">
            <span className="sidebar-stat-card__value">{category.productCount}</span>
            <span className="sidebar-stat-card__label">Total Products</span>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Quick Actions</h3>
            <div className="sidebar-actions">
              <Link href={`/products?category=${category.type}`} className="sidebar-action">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                View all {category.name} products
              </Link>
              <Link href={`/products/new?category=${category.type}`} className="sidebar-action">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add new product
              </Link>
              <Link href={`/products/categories/${params.id}/edit`} className="sidebar-action">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit category details
              </Link>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Timestamps</h3>
            <div className="timestamps">
              <div className="ts-row">
                <span className="ts-label">Created</span>
                <span className="ts-value">{category.createdAt}</span>
              </div>
              <div className="ts-row">
                <span className="ts-label">Updated</span>
                <span className="ts-value">{category.updatedAt}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .cat-detail {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .cat-detail__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cat-detail__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding-top: 4px;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          height: 38px; padding: 0 16px;
          background: #1A1A18; color: #F5F0E8;
          border: none; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: background 0.15s; white-space: nowrap;
        }

        .btn-primary:hover { background: #2E2E2A; }

        .btn-sm-primary {
          display: inline-flex; align-items: center; gap: 6px;
          height: 32px; padding: 0 12px;
          background: #1A1A18; color: #F5F0E8;
          border: none; border-radius: 7px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.8125rem; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: background 0.15s;
        }

        .btn-sm-primary:hover { background: #2E2E2A; }

        .btn-danger-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          height: 38px; padding: 0 12px;
          background: none; border: none;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 500;
          color: #6B6B68; cursor: pointer;
          transition: color 0.15s;
        }

        .btn-danger-ghost:hover { color: #C0392B; }

        .cat-detail__layout {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .cat-detail__layout { grid-template-columns: 1fr; }
        }

        .cat-detail__main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .detail-card__title {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .detail-grid { display: flex; flex-direction: column; }

        .detail-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #F0EDE8;
          align-items: start;
        }

        .detail-row:last-child { border-bottom: none; }

        .detail-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #6B6B68;
          padding-top: 2px;
        }

        .detail-value {
          font-size: 0.9375rem;
          color: #1A1A18;
        }

        .detail-value--mono {
          font-family: 'DM Mono', monospace;
          font-size: 0.8125rem;
          color: #6B6B68;
          background: #F0EDE8;
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
        }

        .table-skeleton {
          height: 280px;
          border-radius: 10px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .cat-detail__sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sidebar-stat-card {
          background: #1A1A18;
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-stat-card__value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #C9A84C;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }

        .sidebar-stat-card__label {
          font-size: 0.8125rem;
          color: #D4D0C8;
          font-weight: 500;
        }

        .sidebar-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-card__title {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .sidebar-actions { display: flex; flex-direction: column; gap: 4px; }

        .sidebar-action {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 34px;
          padding: 0 10px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1A1A18;
          text-decoration: none;
          transition: background 0.15s;
        }

        .sidebar-action:hover { background: #F0EDE8; }

        .timestamps { display: flex; flex-direction: column; gap: 8px; }

        .ts-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .ts-label { font-size: 0.8125rem; color: #6B6B68; }
        .ts-value { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; }
      `}</style>
    </div>
  )
}