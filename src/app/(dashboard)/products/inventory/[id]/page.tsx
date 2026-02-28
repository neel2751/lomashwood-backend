import { Suspense } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { InventoryForm } from '@/components/products/InventoryForm'

import type { Metadata } from 'next'

type Props = { params: { id: string } }

const INVENTORY: Record<string, { productName: string; sku: string; category: string; stock: number; threshold: number; status: 'in-stock' | 'low-stock' | 'out-of-stock'; lastRestocked: string; updatedAt: string }> = {
  'prod-001': { productName: 'Luna White Kitchen', sku: 'KIT-LUNA-WHT', category: 'Kitchen', stock: 42, threshold: 10, status: 'in-stock', lastRestocked: '15 Oct 2024', updatedAt: '2 days ago' },
  'prod-002': { productName: 'Strada Grey Kitchen', sku: 'KIT-STRA-GRY', category: 'Kitchen', stock: 8, threshold: 10, status: 'low-stock', lastRestocked: '3 Oct 2024', updatedAt: '5 days ago' },
  'prod-003': { productName: 'Nordic Bedroom Suite', sku: 'BED-NORD-OAK', category: 'Bedroom', stock: 0, threshold: 5, status: 'out-of-stock', lastRestocked: '20 Sep 2024', updatedAt: 'Today' },
}

const STATUS_CONFIG = {
  'in-stock':    { label: 'In Stock',    color: '#27AE60', bg: '#EAF7EF', border: '#C3E8CC' },
  'low-stock':   { label: 'Low Stock',   color: '#D4820A', bg: '#FFF3DC', border: '#F5DEB5' },
  'out-of-stock':{ label: 'Out of Stock',color: '#C0392B', bg: '#FDF2F2', border: '#F5C6C6' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = INVENTORY[params.id]
  return { title: item ? `Inventory: ${item.productName}` : 'Inventory | Products' }
}

export default function InventoryDetailPage({ params }: Props) {
  const item = INVENTORY[params.id]
  if (!item) notFound()

  const statusConf = STATUS_CONFIG[item.status]
  const stockPct = Math.min(100, Math.round((item.stock / (item.threshold * 4)) * 100))

  return (
    <div className="inv-detail">
      <div className="inv-detail__topbar">
        <PageHeader
          title={item.productName}
          description={`SKU: ${item.sku} · ${item.category}`}
          backHref="/products/inventory"
          backLabel="Inventory"
        />
        <div className="inv-detail__actions">
          <Link href={`/products/${params.id}`} className="btn-outline">View product</Link>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="inv-detail__layout">
        <div className="inv-detail__main">
          <div className="stock-hero" style={{ background: statusConf.bg, borderColor: statusConf.border }}>
            <div className="stock-hero__left">
              <span className="stock-hero__value" style={{ color: statusConf.color }}>{item.stock}</span>
              <span className="stock-hero__label">units in stock</span>
            </div>
            <div className="stock-hero__right">
              <span className="stock-status-pill" style={{ color: statusConf.color, background: 'white', borderColor: statusConf.border }}>
                {item.status === 'out-of-stock' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                )}
                {statusConf.label}
              </span>
              <div className="stock-bar-wrapper">
                <div className="stock-bar">
                  <div className="stock-bar__fill" style={{ width: `${stockPct}%`, background: statusConf.color }} />
                  <div className="stock-bar__threshold" style={{ left: `${Math.min(100, Math.round((item.threshold / (item.threshold * 4)) * 100))}%` }} />
                </div>
                <div className="stock-bar__legend">
                  <span>0</span>
                  <span style={{ color: statusConf.color }}>Threshold: {item.threshold}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Update stock</h2>
            <Suspense fallback={<div className="form-skeleton" />}>
              <InventoryForm inventoryId={params.id} defaultValues={{ stock: item.stock, threshold: item.threshold }} />
            </Suspense>
          </div>
        </div>

        <aside className="inv-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Stock Info</h3>
            {[
              { key: 'Current Stock', val: item.stock.toString() },
              { key: 'Low Stock Threshold', val: item.threshold.toString() },
              { key: 'Last Restocked', val: item.lastRestocked },
              { key: 'Updated', val: item.updatedAt },
            ].map(({ key, val }) => (
              <div key={key} className="sidebar-info-row">
                <span className="sidebar-info-key">{key}</span>
                <span className="sidebar-info-val">{val}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Product</h3>
            {[
              { key: 'Name', val: item.productName },
              { key: 'SKU', val: item.sku },
              { key: 'Category', val: item.category },
            ].map(({ key, val }) => (
              <div key={key} className="sidebar-info-row">
                <span className="sidebar-info-key">{key}</span>
                <span className="sidebar-info-val sidebar-info-val--mono">{val}</span>
              </div>
            ))}
            <Link href={`/products/${params.id}`} className="sidebar-product-link">
              View full product →
            </Link>
          </div>
        </aside>
      </div>

      <style>{`
        .inv-detail { display: flex; flex-direction: column; gap: 24px; }
        .inv-detail__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .inv-detail__actions { display: flex; gap: 10px; padding-top: 4px; }

        .btn-primary { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #2E2E2A; }

        .btn-outline { display: inline-flex; align-items: center; height: 38px; padding: 0 14px; background: #FFFFFF; color: #1A1A18; border: 1.5px solid #E8E6E1; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; text-decoration: none; cursor: pointer; transition: border-color 0.15s; }
        .btn-outline:hover { border-color: #1A1A18; }

        .inv-detail__layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .inv-detail__layout { grid-template-columns: 1fr; } }

        .inv-detail__main { display: flex; flex-direction: column; gap: 16px; }

        .stock-hero { border: 1.5px solid; border-radius: 14px; padding: 24px; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
        .stock-hero__left { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
        .stock-hero__value { font-size: 3.5rem; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
        .stock-hero__label { font-size: 0.875rem; color: #6B6B68; font-weight: 500; }
        .stock-hero__right { flex: 1; display: flex; flex-direction: column; gap: 14px; min-width: 200px; }

        .stock-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border: 1.5px solid; border-radius: 20px; font-size: 0.8125rem; font-weight: 600; width: fit-content; }

        .stock-bar-wrapper { display: flex; flex-direction: column; gap: 6px; }
        .stock-bar { height: 8px; background: rgba(0,0,0,0.08); border-radius: 4px; position: relative; }
        .stock-bar__fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
        .stock-bar__threshold { position: absolute; top: -4px; width: 2px; height: 16px; background: #1A1A18; border-radius: 1px; opacity: 0.3; transform: translateX(-50%); }
        .stock-bar__legend { display: flex; justify-content: space-between; font-size: 0.6875rem; color: #6B6B68; }

        .form-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; }
        .form-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; margin-bottom: 16px; }
        .form-skeleton { height: 180px; border-radius: 8px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .sidebar-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
        .sidebar-card:last-child { margin-bottom: 0; }
        .sidebar-card__title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }

        .sidebar-info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5F3EF; }
        .sidebar-info-row:last-of-type { border-bottom: none; }
        .sidebar-info-key { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-info-val { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; }
        .sidebar-info-val--mono { font-family: 'DM Mono', monospace; font-size: 0.75rem; }

        .sidebar-product-link { display: block; text-align: right; font-size: 0.8125rem; font-weight: 600; color: #8B6914; text-decoration: none; padding-top: 8px; transition: color 0.15s; }
        .sidebar-product-link:hover { color: #C9A84C; }
      `}</style>
    </div>
  )
}