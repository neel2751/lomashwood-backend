import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductDeleteButton } from '@/components/products/ProductDeleteButton'
import { getProductById } from '@servers/products.actions'

import type { Metadata } from 'next'

type Props = { params: { id: string } }

async function fetchProduct(id: string): Promise<Awaited<ReturnType<typeof getProductById>> | null> {
  try {
    return await getProductById(id)
  } catch {
    return null
  }
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number') return 'Not set'
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function buildSlug(title: string, rangeName: string) {
  return [title, rangeName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct(params.id)
  return {
    title: product ? `${product.title} | Products` : 'Product | Products',
  }
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#1F7A45', bg: '#EAF7EF' },
  draft: { label: 'Draft', color: '#6B6B68', bg: '#F0EDE8' },
} as const

export default async function ProductDetailPage({ params }: Props) {
  const product = await fetchProduct(params.id)
  if (!product) notFound()

  const productStatus = product.isPublished ? 'active' : 'draft'
  const status = STATUS_CONFIG[productStatus]
  const categoryLabel = titleCase(product.category)
  const styleLabel = product.style ?? 'Not set'
  const finishLabel = product.finish ?? 'Not set'
  const primaryImage = product.images[0] ?? null
  const seoSlug = buildSlug(product.title, product.rangeName)

  return (
    <div className="product-detail">
      <div className="product-detail__topbar">
        <PageHeader
          title={product.title}
          description={`${categoryLabel} · ${product.rangeName}`}
          backHref="/products"
          backLabel="Products"
        />
        <div className="product-detail__actions">
          <span className="status-badge" style={{ color: status.color, background: status.bg }}>
            {status.label}
          </span>
          <Link href={`/products/${params.id}/duplicate`} className="btn-outline">
            Duplicate
          </Link>
          <ProductDeleteButton productId={params.id} className="btn-danger" />
          <Link href={`/products/${params.id}/edit`} className="btn-primary">
            Edit Product
          </Link>
        </div>
      </div>

      <div className="product-detail__layout">
        <div className="product-detail__main">
          <div className="detail-card detail-card--hero">
            <div className="hero-copy">
              <div className="eyebrow">Catalogue Preview</div>
              <h2 className="detail-card__heading">Images and front-of-house presentation</h2>
              <p className="detail-card__description">
                Review the current gallery, listing cover image, and the customer-facing description for this product.
              </p>
            </div>

            {primaryImage ? (
              <div className="gallery-stack">
                <div className="gallery-featured">
                  <img src={primaryImage} alt={product.title} className="gallery-image" />
                </div>
                {product.images.length > 1 ? (
                  <div className="gallery-grid">
                    {product.images.slice(1).map((image, index) => (
                      <div key={`${image}-${index}`} className="gallery-thumb">
                        <img src={image} alt={`${product.title} ${index + 2}`} className="gallery-thumb__image" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="gallery-empty">No product images uploaded yet.</div>
            )}
          </div>

          <div className="detail-card">
            <h2 className="detail-card__title">Description</h2>
            <p className="rich-copy">{product.description}</p>
          </div>

          <div className="detail-card">
            <h2 className="detail-card__title">Product Information</h2>
            <dl className="detail-grid">
              {[
                { label: 'Title', value: product.title },
                { label: 'Category', value: categoryLabel },
                { label: 'Range', value: product.rangeName },
                { label: 'Style', value: styleLabel },
                { label: 'Finish', value: finishLabel },
                { label: 'Status', value: status.label, badge: true },
                { label: 'Featured', value: product.isFeatured ? 'Yes' : 'No' },
                { label: 'Popular', value: product.isPopular ? 'Yes' : 'No' },
                { label: 'Base Price', value: formatCurrency(product.price) },
                { label: 'SEO Slug Preview', value: `/products/${seoSlug || product.id}` },
              ].map(({ label, value, badge }) => (
                <div key={label} className="detail-row">
                  <dt className="detail-label">{label}</dt>
                  <dd className="detail-value">
                    {badge ? (
                      <span className="status-badge" style={{ color: status.color, background: status.bg }}>
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="detail-card">
            <h2 className="detail-card__title">Available Colours</h2>
            {product.colours.length > 0 ? (
              <div className="colour-list">
                {product.colours.map((colour) => (
                  <div key={colour.id} className="colour-chip">
                    <span
                      className="colour-chip__swatch"
                      style={{
                        background: colour.hexCode,
                        border: colour.hexCode === '#FFFFFF' ? '1px solid #D7D3CA' : 'none',
                      }}
                    />
                    <span className="colour-chip__label">{colour.name}</span>
                    <span className="colour-chip__code">{colour.hexCode}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No colours linked to this product yet.</p>
            )}
          </div>

          <div className="detail-card">
            <h2 className="detail-card__title">Units / Sizes</h2>
            {product.sizes.length > 0 ? (
              <div className="size-grid">
                {product.sizes.map((size) => (
                  <div key={size.id} className="size-card">
                    <div className="size-card__title">{size.title}</div>
                    <div className="size-card__description">{size.description || 'No description provided.'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No sizes linked to this product yet.</p>
            )}
          </div>
        </div>

        <aside className="product-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Quick Stats</h3>
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat__label">Colours</span>
                <span className="quick-stat__value">{product.colours.length}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Sizes</span>
                <span className="quick-stat__value">{product.sizes.length}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Images</span>
                <span className="quick-stat__value">{product.images.length}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Catalogue Metadata</h3>
            <div className="sidebar-list">
              <span>Product ID: {product.id}</span>
              <span>Primary image: {primaryImage ? 'Ready' : 'Missing'}</span>
              <span>Range: {product.rangeName}</span>
              <span>Category: {categoryLabel}</span>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Timestamps</h3>
            <div className="sidebar-list">
              <span>Created: {formatDate(product.createdAt)}</span>
              <span>Updated: {formatDate(product.updatedAt)}</span>
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

        .btn-outline {
          display: inline-flex;
          align-items: center;
          height: 38px;
          padding: 0 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          background: #FFFFFF;
          color: #1A1A18;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-outline:hover { border-color: #1A1A18; }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          height: 38px;
          padding: 0 14px;
          border: 1.5px solid #E7D1CF;
          border-radius: 8px;
          background: #FFF9F8;
          color: #AF3E34;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }

        .btn-danger:hover {
          border-color: #AF3E34;
          background: #FDEDEC;
        }

        .btn-danger:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .product-detail__layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .product-detail__layout { grid-template-columns: 1fr; }
        }

        .product-detail__main,
        .product-detail__sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .detail-card,
        .sidebar-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-card--hero {
          background: linear-gradient(180deg, #FCFBF7 0%, #FFFFFF 100%);
        }

        .eyebrow {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8B6914;
        }

        .detail-card__heading {
          font-size: 1.375rem;
          font-weight: 700;
          color: #1A1A18;
          line-height: 1.2;
        }

        .detail-card__description,
        .empty-copy,
        .rich-copy {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #4B4B47;
        }

        .detail-card__title,
        .sidebar-card__title {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .gallery-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .gallery-featured,
        .gallery-thumb {
          overflow: hidden;
          border-radius: 12px;
          background: #F6F3EE;
          border: 1px solid #ECE6DA;
        }

        .gallery-featured {
          aspect-ratio: 16 / 10;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .gallery-thumb {
          aspect-ratio: 4 / 3;
        }

        .gallery-image,
        .gallery-thumb__image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-empty {
          min-height: 260px;
          border: 1.5px dashed #D9D2C6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6B6B68;
          background: #FAFAF8;
          text-align: center;
          padding: 24px;
        }

        .detail-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 170px 1fr;
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
          word-break: break-word;
        }

        .colour-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 10px;
        }

        .colour-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          padding: 10px 12px;
          background: #FFFFFF;
        }

        .colour-chip__swatch {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .colour-chip__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .colour-chip__code {
          margin-left: auto;
          font-size: 0.75rem;
          color: #6B6B68;
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }

        .size-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          background: #FCFBF8;
        }

        .size-card__title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .size-card__description {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.6;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .quick-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 10px;
          background: #FAFAF8;
          border: 1px solid #EFEAE1;
        }

        .quick-stat__label {
          font-size: 0.8125rem;
          color: #6B6B68;
        }

        .quick-stat__value {
          font-size: 1rem;
          font-weight: 700;
          color: #1A1A18;
        }

        .sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.875rem;
          color: #1A1A18;
        }
      `}</style>
    </div>
  )
}