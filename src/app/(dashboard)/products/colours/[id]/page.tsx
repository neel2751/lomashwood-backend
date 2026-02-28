import { Suspense } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { ColourForm } from '@/components/products/ColourForm'
import { ProductTable } from '@/components/products/ProductTable'

import type { Metadata } from 'next'

type Props = { params: { id: string } }

const COLOURS: Record<string, { name: string; hex: string; category: string; productCount: number; createdAt: string; updatedAt: string }> = {
  'arctic-white':  { name: 'Arctic White',   hex: '#F8F8F6', category: 'Both',    productCount: 34, createdAt: '12 Mar 2024', updatedAt: '2 days ago' },
  'graphite-grey': { name: 'Graphite Grey',  hex: '#5A5A5A', category: 'Kitchen', productCount: 28, createdAt: '12 Mar 2024', updatedAt: '1 week ago' },
  'navy-blue':     { name: 'Navy Blue',      hex: '#1B2A4A', category: 'Bedroom', productCount: 19, createdAt: '14 Mar 2024', updatedAt: '3 days ago' },
  'cashmere':      { name: 'Cashmere',       hex: '#D4C5B0', category: 'Both',    productCount: 41, createdAt: '10 Mar 2024', updatedAt: 'Today' },
  'warm-oak':      { name: 'Warm Oak',       hex: '#C8A87A', category: 'Bedroom', productCount: 15, createdAt: '18 Mar 2024', updatedAt: '1 week ago' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const colour = COLOURS[params.id]
  return { title: colour ? `${colour.name} | Colours` : 'Colour | Products' }
}

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

export default function ColourDetailPage({ params }: Props) {
  const colour = COLOURS[params.id]
  if (!colour) notFound()

  const textColor = isLight(colour.hex) ? '#1A1A18' : '#F5F0E8'

  return (
    <div className="colour-detail">
      <div className="colour-detail__topbar">
        <PageHeader
          title={colour.name}
          description={`${colour.category} · ${colour.productCount} products`}
          backHref="/products/colours"
          backLabel="Colours"
        />
        <div className="colour-detail__actions">
          <button className="btn-danger-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Changes
          </button>
        </div>
      </div>

      <div className="colour-detail__layout">
        <div className="colour-detail__main">
          <div className="colour-hero" style={{ background: colour.hex }}>
            <div className="colour-hero__content" style={{ color: textColor }}>
              <h2 className="colour-hero__name">{colour.name}</h2>
              <code className="colour-hero__hex">{colour.hex}</code>
            </div>
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Edit colour</h2>
            <Suspense fallback={<div className="form-skeleton" />}>
              <ColourForm colourId={params.id} defaultValues={{ name: colour.name, hex: colour.hex, category: colour.category }} />
            </Suspense>
          </div>

          <div className="products-section">
            <h2 className="section-label">Products using this colour ({colour.productCount})</h2>
            <Suspense fallback={<div className="table-skeleton" />}>
              <ProductTable colourFilter={params.id} />
            </Suspense>
          </div>
        </div>

        <aside className="colour-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Stats</h3>
            <div className="sidebar-stat">
              <span className="sidebar-stat__value" style={{ color: colour.hex, textShadow: isLight(colour.hex) ? 'none' : undefined }}>
                {colour.productCount}
              </span>
              <span className="sidebar-stat__label">products</span>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Info</h3>
            {[
              { key: 'Category', val: colour.category },
              { key: 'Created', val: colour.createdAt },
              { key: 'Updated', val: colour.updatedAt },
            ].map(({ key, val }) => (
              <div key={key} className="sidebar-info-row">
                <span className="sidebar-info-key">{key}</span>
                <span className="sidebar-info-val">{val}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Actions</h3>
            <div className="sidebar-actions">
              <Link href={`/products/colours/new`} className="sidebar-action-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                </svg>
                Duplicate colour
              </Link>
              <Link href={`/products?colour=${params.id}`} className="sidebar-action-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                View all products
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .colour-detail { display: flex; flex-direction: column; gap: 24px; }

        .colour-detail__topbar {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }

        .colour-detail__actions { display: flex; gap: 10px; padding-top: 4px; align-items: center; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px;
          background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-primary:hover { background: #2E2E2A; }

        .btn-danger-ghost {
          display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px;
          background: none; border: 1.5px solid #F5C6C6; border-radius: 8px; color: #C0392B;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-danger-ghost:hover { background: #FDF2F2; }

        .colour-detail__layout {
          display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start;
        }
        @media (max-width: 900px) { .colour-detail__layout { grid-template-columns: 1fr; } }

        .colour-detail__main { display: flex; flex-direction: column; gap: 16px; }

        .colour-hero {
          height: 140px; border-radius: 14px; border: 1.5px solid rgba(0,0,0,0.06);
          display: flex; align-items: flex-end; padding: 18px 22px; transition: background 0.2s;
        }

        .colour-hero__content { display: flex; flex-direction: column; gap: 4px; }
        .colour-hero__name { font-family: 'Playfair Display', Georgia, serif; font-size: 1.5rem; font-weight: 700; }
        .colour-hero__hex { font-family: 'DM Mono', monospace; font-size: 0.875rem; opacity: 0.75; }

        .form-card {
          background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px;
          display: flex; flex-direction: column; gap: 4px;
        }

        .form-card__title {
          font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem;
          font-weight: 700; color: #1A1A18; margin-bottom: 12px;
        }

        .form-skeleton { height: 200px; border-radius: 8px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .table-skeleton { height: 300px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }

        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .section-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; margin-bottom: 12px; }

        .sidebar-card {
          background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 18px;
          display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;
        }
        .sidebar-card:last-child { margin-bottom: 0; }

        .sidebar-card__title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }

        .sidebar-stat { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-stat__value { font-size: 2.5rem; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
        .sidebar-stat__label { font-size: 0.8125rem; color: #6B6B68; }

        .sidebar-info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5F3EF; }
        .sidebar-info-row:last-child { border-bottom: none; }
        .sidebar-info-key { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-info-val { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; }

        .sidebar-actions { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-action-link {
          display: flex; align-items: center; gap: 8px; padding: 9px 10px;
          border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: #1A1A18;
          text-decoration: none; transition: background 0.15s;
        }
        .sidebar-action-link:hover { background: #F5F3EF; }
      `}</style>
    </div>
  )
}