import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { SizeForm } from '@/components/products/SizeForm'
import { ProductTable } from '@/components/products/ProductTable'

type Props = { params: { id: string } }

const SIZES: Record<string, { name: string; category: string; width: number; height: number; depth: number; description: string; productCount: number; createdAt: string; updatedAt: string }> = {
  'base-600':    { name: 'Base Unit 600mm',   category: 'Kitchen', width: 600,  height: 870,  depth: 560, description: 'Standard base unit for kitchen runs.',        productCount: 18, createdAt: '12 Mar 2024', updatedAt: '2 days ago' },
  'base-900':    { name: 'Base Unit 900mm',   category: 'Kitchen', width: 900,  height: 870,  depth: 560, description: 'Wide base unit for hob or sink positions.',    productCount: 14, createdAt: '12 Mar 2024', updatedAt: '1 week ago' },
  'wall-600':    { name: 'Wall Unit 600mm',   category: 'Kitchen', width: 600,  height: 720,  depth: 320, description: 'Standard wall-mounted cabinet unit.',          productCount: 12, createdAt: '12 Mar 2024', updatedAt: '3 days ago' },
  'wardrobe-1800': { name: 'Wardrobe 1800mm', category: 'Bedroom', width: 1800, height: 2200, depth: 600, description: 'Full-height double wardrobe for bedrooms.',    productCount: 22, createdAt: '14 Mar 2024', updatedAt: 'Today' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const size = SIZES[params.id]
  return { title: size ? `${size.name} | Sizes` : 'Size | Products' }
}

export default function SizeDetailPage({ params }: Props) {
  const size = SIZES[params.id]
  if (!size) notFound()

  return (
    <div className="size-detail">
      <div className="size-detail__topbar">
        <PageHeader
          title={size.name}
          description={`${size.category} · ${size.productCount} products`}
          backHref="/products/sizes"
          backLabel="Sizes"
        />
        <div className="size-detail__actions">
          <button className="btn-danger-ghost">Delete</button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="size-detail__layout">
        <div className="size-detail__main">
          <div className="dims-hero">
            <div className="dims-hero__box" aria-label={`${size.width}mm wide, ${size.height}mm tall, ${size.depth}mm deep`}>
              <div className="dims-hero__face dims-hero__face--front">
                <span className="dims-hero__label">{size.width}<small>mm</small></span>
              </div>
              <div className="dims-hero__annotations">
                <span className="dims-hero__ann dims-hero__ann--height">↕ {size.height}mm</span>
                <span className="dims-hero__ann dims-hero__ann--depth">↗ {size.depth}mm</span>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Edit size</h2>
            <Suspense fallback={<div className="form-skeleton" />}>
              <SizeForm sizeId={params.id} defaultValues={{ name: size.name, category: size.category, width: size.width, height: size.height, depth: size.depth, description: size.description }} />
            </Suspense>
          </div>

          <div className="products-section">
            <h2 className="section-label">Products using this size ({size.productCount})</h2>
            <Suspense fallback={<div className="table-skeleton" />}>
              <ProductTable sizeFilter={params.id} />
            </Suspense>
          </div>
        </div>

        <aside className="size-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Dimensions</h3>
            {[
              { label: 'Width', value: `${size.width}mm` },
              { label: 'Height', value: `${size.height}mm` },
              { label: 'Depth', value: `${size.depth}mm` },
            ].map(({ label, value }) => (
              <div key={label} className="sidebar-dim-row">
                <span className="sidebar-dim-label">{label}</span>
                <code className="sidebar-dim-value">{value}</code>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Info</h3>
            {[
              { key: 'Category',  val: size.category },
              { key: 'Products',  val: size.productCount.toString() },
              { key: 'Created',   val: size.createdAt },
              { key: 'Updated',   val: size.updatedAt },
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
              <Link href="/products/sizes/new" className="sidebar-action-link">Duplicate size</Link>
              <Link href={`/products?size=${params.id}`} className="sidebar-action-link">View all products</Link>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .size-detail { display: flex; flex-direction: column; gap: 24px; }

        .size-detail__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .size-detail__actions { display: flex; gap: 10px; padding-top: 4px; }

        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #2E2E2A; }

        .btn-danger-ghost { display: inline-flex; align-items: center; height: 38px; padding: 0 14px; background: none; border: 1.5px solid #F5C6C6; border-radius: 8px; color: #C0392B; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-danger-ghost:hover { background: #FDF2F2; }

        .size-detail__layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .size-detail__layout { grid-template-columns: 1fr; } }

        .size-detail__main { display: flex; flex-direction: column; gap: 16px; }

        .dims-hero {
          background: #F7F5F0; border: 1.5px solid #E8E6E1; border-radius: 14px;
          padding: 28px; display: flex; align-items: center; justify-content: center;
        }
        .dims-hero__box { display: flex; gap: 24px; align-items: center; }
        .dims-hero__face--front {
          width: 120px; height: 80px; background: #FFFFFF;
          border: 2px solid #C9A84C; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .dims-hero__label { font-family: 'DM Mono', monospace; font-size: 1rem; font-weight: 600; color: #8B6914; }
        .dims-hero__label small { font-size: 0.625rem; color: #6B6B68; margin-left: 2px; }
        .dims-hero__annotations { display: flex; flex-direction: column; gap: 8px; }
        .dims-hero__ann { font-family: 'DM Mono', monospace; font-size: 0.8125rem; color: #6B6B68; }

        .form-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 4px; }
        .form-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; margin-bottom: 12px; }

        .form-skeleton { height: 220px; border-radius: 8px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .table-skeleton { height: 300px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .section-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; margin-bottom: 12px; }

        .sidebar-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
        .sidebar-card:last-child { margin-bottom: 0; }
        .sidebar-card__title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }

        .sidebar-dim-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5F3EF; }
        .sidebar-dim-row:last-child { border-bottom: none; }
        .sidebar-dim-label { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-dim-value { font-family: 'DM Mono', monospace; font-size: 0.8125rem; color: #1A1A18; background: #F7F5F0; padding: 2px 8px; border-radius: 4px; }

        .sidebar-info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5F3EF; }
        .sidebar-info-row:last-child { border-bottom: none; }
        .sidebar-info-key { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-info-val { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; }

        .sidebar-actions { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-action-link { display: flex; align-items: center; padding: 9px 10px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: #1A1A18; text-decoration: none; transition: background 0.15s; }
        .sidebar-action-link:hover { background: #F5F3EF; }
      `}</style>
    </div>
  )
}