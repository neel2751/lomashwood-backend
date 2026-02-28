import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

type Props = { params: { id: string } }

type Product = {
  id: string
  title: string
  category: 'Kitchen' | 'Bedroom'
  range: string
  status: 'active' | 'draft' | 'archived'
  style: string
  finish: string
  price: number
  comparePrice?: number
  colourCount: number
  imageCount: number
  createdAt: string
  updatedAt: string
}

const MOCK_PRODUCTS: Record<string, Product> = {
  'ashford-shaker-white': {
    id: 'ashford-shaker-white',
    title: 'Ashford Shaker — Porcelain White',
    category: 'Kitchen',
    range: 'Shaker Collection',
    status: 'active',
    style: 'Shaker',
    finish: 'Matt',
    price: 8990,
    comparePrice: 12000,
    colourCount: 6,
    imageCount: 8,
    createdAt: '12 Jan 2024',
    updatedAt: '2 hours ago',
  },
  'oslo-handleless-anthracite': {
    id: 'oslo-handleless-anthracite',
    title: 'Oslo Handleless — Anthracite',
    category: 'Kitchen',
    range: 'Contemporary',
    status: 'active',
    style: 'Handleless',
    finish: 'Gloss',
    price: 10500,
    colourCount: 4,
    imageCount: 6,
    createdAt: '5 Mar 2024',
    updatedAt: 'Yesterday',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = MOCK_PRODUCTS[params.id]
  return {
    title: product ? `${product.title} | Products` : 'Product | Products',
  }
}

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: '#27AE60', bg: '#EAF7EF' },
  draft:    { label: 'Draft',    color: '#6B6B68', bg: '#F0EDE8' },
  archived: { label: 'Archived', color: '#D4820A', bg: '#FFF3DC' },
}

export default function ProductDetailPage({ params }: Props) {
  const product = MOCK_PRODUCTS[params.id]
  if (!product) notFound()

  const status = STATUS_CONFIG[product.status]

  return (
    <div className="product-detail">
      <div className="product-detail__topbar">
        <PageHeader
          title={product.title}
          description={`${product.category} · ${product.range}`}
          backHref="/products"
          backLabel="Products"
        />
        <div className="product-detail__actions">
          <span
            className="status-badge"
            style={{ color: status.color, background: status.bg }}
          >
            {status.label}
          </span>
          <Link href={`/products/${params.id}/duplicate`} className="btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Duplicate
          </Link>
          <button className="btn-danger-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
          <Link href={`/products/${params.id}/edit`} className="btn-primary">
            Edit Product
          </Link>
        </div>
      </div>

      <div className="product-detail__layout">
        <div className="product-detail__main">
          <div className="detail-card">
            <h2 className="detail-card__title">Product Information</h2>
            <dl className="detail-grid">
              {[
                { label: 'Title',     value: product.title },
                { label: 'Category',  value: product.category },
                { label: 'Range',     value: product.range },
                { label: 'Style',     value: product.style },
                { label: 'Finish',    value: product.finish },
                { label: 'Status',    value: product.status, badge: true },
              ].map(({ label, value, badge }) => (
                <div key={label} className="detail-row">
                  <dt className="detail-label">{label}</dt>
                  <dd className="detail-value">
                    {badge ? (
                      <span
                        className="status-badge"
                        style={{ color: STATUS_CONFIG[product.status].color, background: STATUS_CONFIG[product.status].bg }}
                      >
                        {value}
                      </span>
                    ) : value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="detail-card">
            <h2 className="detail-card__title">Pricing</h2>
            <dl className="detail-grid">
              <div className="detail-row">
                <dt className="detail-label">Base Price</dt>
                <dd className="detail-value detail-value--price">
                  £{product.price.toLocaleString()}
                </dd>
              </div>
              {product.comparePrice && (
                <div className="detail-row">
                  <dt className="detail-label">Compare-at Price</dt>
                  <dd className="detail-value detail-value--compare">
                    £{product.comparePrice.toLocaleString()}
                    <span className="saving">
                      Save £{(product.comparePrice - product.price).toLocaleString()}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="detail-card">
            <h2 className="detail-card__title">Media</h2>
            <div className="media-summary">
              <div className="media-stat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>{product.imageCount} images</span>
              </div>
              <Link href={`/products/${params.id}/edit#images`} className="btn-link">
                Manage images →
              </Link>
            </div>
          </div>
        </div>

        <aside className="product-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Quick Stats</h3>
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat__label">Colours</span>
                <span className="quick-stat__value">{product.colourCount}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Images</span>
                <span className="quick-stat__value">{product.imageCount}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Timestamps</h3>
            <div className="timestamps">
              <div className="timestamp">
                <span className="timestamp__label">Created</span>
                <span className="timestamp__value">{product.createdAt}</span>
              </div>
              <div className="timestamp">
                <span className="timestamp__label">Last updated</span>
                <span className="timestamp__value">{product.updatedAt}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Actions</h3>
            <div className="sidebar-actions">
              <button className="sidebar-action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                View on website
              </button>
              <button className="sidebar-action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Copy product URL
              </button>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .product-detail {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .product-detail__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .product-detail__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding-top: 4px;
          flex-wrap: wrap;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 20px;
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

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          height: 38px; padding: 0 12px;
          background: #FFFFFF; color: #1A1A18;
          border: 1.5px solid #E8E6E1; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 500;
          text-decoration: none; cursor: pointer;
          transition: border-color 0.15s; white-space: nowrap;
        }

        .btn-ghost:hover { border-color: #1A1A18; }

        .btn-danger-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          height: 38px; padding: 0 12px;
          background: none; border: none;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 500;
          color: #6B6B68; cursor: pointer;
          transition: color 0.15s; white-space: nowrap;
        }

        .btn-danger-ghost:hover { color: #C0392B; }

        .product-detail__layout {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .product-detail__layout { grid-template-columns: 1fr; }
        }

        .product-detail__main {
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

        .detail-card__title {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .detail-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #F0EDE8;
          align-items: center;
        }

        .detail-row:last-child { border-bottom: none; }

        .detail-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #6B6B68;
        }

        .detail-value {
          font-size: 0.9375rem;
          color: #1A1A18;
          font-weight: 400;
        }

        .detail-value--price {
          font-size: 1.25rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #8B6914;
        }

        .detail-value--compare {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: line-through;
          color: #6B6B68;
        }

        .saving {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #27AE60;
          text-decoration: none;
          background: #EAF7EF;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .media-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .media-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .btn-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #8B6914;
          text-decoration: none;
          transition: color 0.15s;
        }

        .btn-link:hover { color: #C9A84C; }

        .product-detail__sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sidebar-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sidebar-card__title {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .quick-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px;
          background: #F7F5F0;
          border-radius: 8px;
        }

        .quick-stat__label {
          font-size: 0.75rem;
          color: #6B6B68;
          font-weight: 500;
        }

        .quick-stat__value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1A1A18;
        }

        .timestamps {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .timestamp {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .timestamp__label {
          font-size: 0.8125rem;
          color: #6B6B68;
        }

        .timestamp__value {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .sidebar-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          height: 36px;
          padding: 0 12px;
          background: #F7F5F0;
          border: 1px solid #E8E6E1;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1A1A18;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          text-align: left;
        }

        .sidebar-action-btn:hover {
          background: #F0EDE8;
          border-color: #D4CDBF;
        }
      `}</style>
    </div>
  )
}