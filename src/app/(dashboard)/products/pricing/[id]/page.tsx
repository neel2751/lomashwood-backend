import { Suspense } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { PricingForm } from '@/components/products/PricingForm'

import type { Metadata } from 'next'

type Props = { params: { id: string } }

const PRICING_RULES: Record<string, {
  name: string
  ruleType: 'fixed' | 'percentage' | 'compare-at'
  basePrice: number
  compareAt: number | null
  discount: number | null
  appliesTo: string
  productCount: number
  createdAt: string
  updatedAt: string
}> = {
  'rule-001': { name: 'Standard Kitchen Pricing', ruleType: 'fixed', basePrice: 8200, compareAt: null, discount: null, appliesTo: 'Kitchen', productCount: 98, createdAt: '12 Mar 2024', updatedAt: '2 days ago' },
  'rule-002': { name: 'Spring Sale – 20% Off', ruleType: 'percentage', basePrice: 0, compareAt: null, discount: 20, appliesTo: 'All Products', productCount: 44, createdAt: '1 Apr 2024', updatedAt: 'Today' },
  'rule-003': { name: 'Luna Bedroom Sale', ruleType: 'compare-at', basePrice: 5200, compareAt: 6500, discount: null, appliesTo: 'Bedroom', productCount: 12, createdAt: '5 Apr 2024', updatedAt: '3 days ago' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rule = PRICING_RULES[params.id]
  return { title: rule ? `${rule.name} | Pricing` : 'Pricing | Products' }
}

const RULE_TYPE_LABELS = { fixed: 'Fixed Price', 'compare-at': 'Sale Price', percentage: 'Percentage Off' }

export default function PricingDetailPage({ params }: Props) {
  const rule = PRICING_RULES[params.id]
  if (!rule) notFound()

  const savings = rule.compareAt ? rule.compareAt - rule.basePrice : null
  const savingsPct = rule.compareAt ? Math.round(((rule.compareAt - rule.basePrice) / rule.compareAt) * 100) : null

  return (
    <div className="pricing-detail">
      <div className="pricing-detail__topbar">
        <PageHeader
          title={rule.name}
          description={`${RULE_TYPE_LABELS[rule.ruleType]} · ${rule.appliesTo} · ${rule.productCount} products`}
          backHref="/products/pricing"
          backLabel="Pricing"
        />
        <div className="pricing-detail__actions">
          <button className="btn-danger-ghost">Delete rule</button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="pricing-detail__layout">
        <div className="pricing-detail__main">
          <div className="price-hero">
            {rule.ruleType === 'fixed' && (
              <div className="price-hero__fixed">
                <span className="price-hero__currency">£</span>
                <span className="price-hero__amount">{rule.basePrice.toLocaleString()}</span>
                <span className="price-hero__label">base price</span>
              </div>
            )}
            {rule.ruleType === 'compare-at' && rule.compareAt && (
              <div className="price-hero__sale">
                <div className="price-hero__sale-price">
                  <span className="price-hero__currency">£</span>
                  <span className="price-hero__amount">{rule.basePrice.toLocaleString()}</span>
                </div>
                <div className="price-hero__sale-meta">
                  <span className="price-hero__original">£{rule.compareAt.toLocaleString()}</span>
                  <span className="price-hero__badge">–{savingsPct}%</span>
                </div>
                <span className="price-hero__label">customer saves £{savings?.toLocaleString()}</span>
              </div>
            )}
            {rule.ruleType === 'percentage' && rule.discount && (
              <div className="price-hero__pct">
                <span className="price-hero__pct-value">{rule.discount}%</span>
                <span className="price-hero__label">off original price</span>
              </div>
            )}
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Edit rule</h2>
            <Suspense fallback={<div className="form-skeleton" />}>
              <PricingForm pricingId={params.id} defaultValues={{ name: rule.name, ruleType: rule.ruleType, basePrice: rule.basePrice, compareAt: rule.compareAt, discount: rule.discount, appliesTo: rule.appliesTo }} />
            </Suspense>
          </div>
        </div>

        <aside className="pricing-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Rule Summary</h3>
            {[
              { key: 'Type', val: RULE_TYPE_LABELS[rule.ruleType] },
              { key: 'Applies to', val: rule.appliesTo },
              { key: 'Products', val: rule.productCount.toString() },
              { key: 'Created', val: rule.createdAt },
              { key: 'Updated', val: rule.updatedAt },
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
              <Link href="/products/pricing/new" className="sidebar-action-link">Duplicate rule</Link>
              <Link href={`/products?pricing=${params.id}`} className="sidebar-action-link">View affected products</Link>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .pricing-detail { display: flex; flex-direction: column; gap: 24px; }
        .pricing-detail__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .pricing-detail__actions { display: flex; gap: 10px; padding-top: 4px; }

        .btn-primary { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #2E2E2A; }
        .btn-danger-ghost { display: inline-flex; align-items: center; height: 38px; padding: 0 14px; background: none; border: 1.5px solid #F5C6C6; border-radius: 8px; color: #C0392B; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-danger-ghost:hover { background: #FDF2F2; }

        .pricing-detail__layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .pricing-detail__layout { grid-template-columns: 1fr; } }
        .pricing-detail__main { display: flex; flex-direction: column; gap: 16px; }

        .price-hero { background: #111110; border-radius: 14px; padding: 32px; color: #F5F0E8; display: flex; align-items: center; justify-content: center; }
        .price-hero__fixed { display: flex; align-items: baseline; gap: 4px; }
        .price-hero__currency { font-size: 1.75rem; font-weight: 400; color: #C9A84C; margin-bottom: 4px; }
        .price-hero__amount { font-size: 4rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; color: #F5F0E8; }
        .price-hero__label { font-size: 0.875rem; color: #6B6B68; margin-left: 10px; align-self: flex-end; padding-bottom: 6px; }

        .price-hero__sale { display: flex; flex-direction: column; gap: 8px; }
        .price-hero__sale-price { display: flex; align-items: baseline; gap: 4px; }
        .price-hero__sale-meta { display: flex; align-items: center; gap: 10px; }
        .price-hero__original { font-size: 1.25rem; color: #6B6B68; text-decoration: line-through; }
        .price-hero__badge { background: #C0392B; color: #fff; font-size: 0.875rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }

        .price-hero__pct { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .price-hero__pct-value { font-size: 5rem; font-weight: 900; color: #C9A84C; line-height: 1; }

        .form-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; }
        .form-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; margin-bottom: 16px; }
        .form-skeleton { height: 260px; border-radius: 8px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .sidebar-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
        .sidebar-card:last-child { margin-bottom: 0; }
        .sidebar-card__title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }
        .sidebar-info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5F3EF; }
        .sidebar-info-row:last-of-type { border-bottom: none; }
        .sidebar-info-key { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-info-val { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; }
        .sidebar-actions { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-action-link { display: flex; align-items: center; padding: 9px 10px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: #1A1A18; text-decoration: none; transition: background 0.15s; }
        .sidebar-action-link:hover { background: #F5F3EF; }
      `}</style>
    </div>
  )
}