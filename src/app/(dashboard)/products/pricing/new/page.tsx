'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'

type RuleType = 'fixed' | 'percentage' | 'compare-at'

export default function NewPricingRulePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ruleType, setRuleType] = useState<RuleType>('fixed')
  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [discount, setDiscount] = useState('')
  const [appliesTo, setAppliesTo] = useState<'all' | 'kitchen' | 'bedroom' | 'selected'>('all')
  const [error, setError] = useState<string | null>(null)

  const savings = basePrice && compareAt
    ? (parseFloat(compareAt) - parseFloat(basePrice)).toFixed(2)
    : null
  const savingsPct = basePrice && compareAt && parseFloat(compareAt) > 0
    ? Math.round(((parseFloat(compareAt) - parseFloat(basePrice)) / parseFloat(compareAt)) * 100)
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Rule name is required.'); return }
    if (!basePrice) { setError('Base price is required.'); return }

    startTransition(async () => {
      try {
        const res = await fetch('/api/products/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, ruleType, basePrice: parseFloat(basePrice), compareAt: compareAt ? parseFloat(compareAt) : null, discount: discount ? parseFloat(discount) : null, appliesTo }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message ?? 'Failed to create pricing rule.')
          return
        }
        router.push('/products/pricing')
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="new-pricing-page">
      <PageHeader
        title="New Price Rule"
        description="Set a base price, optional compare-at price, or percentage discount."
        backHref="/products/pricing"
        backLabel="Pricing"
      />

      <div className="new-pricing-layout">
        <form className="new-pricing-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="form-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 4.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-card">
            <h2 className="form-card__title">Rule details</h2>

            <div className="field">
              <label htmlFor="rule-name">Rule name <span className="req">*</span></label>
              <input id="rule-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard Kitchen Pricing" maxLength={80} />
            </div>

            <div className="field">
              <label>Rule type</label>
              <div className="rule-type-options">
                {[
                  { value: 'fixed', label: 'Fixed price', desc: 'Set a specific price in £', icon: '£' },
                  { value: 'compare-at', label: 'Sale price', desc: 'Base + compare-at (strikethrough)', icon: '%' },
                  { value: 'percentage', label: 'Percentage off', desc: 'Discount off original price', icon: '↓' },
                ].map(opt => (
                  <label key={opt.value} className={`rule-type-option${ruleType === opt.value ? ' rule-type-option--active' : ''}`}>
                    <input type="radio" name="ruleType" value={opt.value} checked={ruleType === opt.value as RuleType} onChange={() => setRuleType(opt.value as RuleType)} />
                    <span className="rule-type-option__icon">{opt.icon}</span>
                    <span className="rule-type-option__body">
                      <span className="rule-type-option__label">{opt.label}</span>
                      <span className="rule-type-option__desc">{opt.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Applies to</label>
              <div className="applies-to-options">
                {[
                  { value: 'all', label: 'All products' },
                  { value: 'kitchen', label: 'Kitchen only' },
                  { value: 'bedroom', label: 'Bedroom only' },
                  { value: 'selected', label: 'Selected products' },
                ].map(opt => (
                  <label key={opt.value} className={`applies-option${appliesTo === opt.value ? ' applies-option--active' : ''}`}>
                    <input type="radio" name="appliesTo" value={opt.value} checked={appliesTo === opt.value as typeof appliesTo} onChange={() => setAppliesTo(opt.value as typeof appliesTo)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Pricing</h2>

            {ruleType !== 'percentage' && (
              <div className="field">
                <label htmlFor="base-price">
                  {ruleType === 'compare-at' ? 'Sale price' : 'Base price'} <span className="req">*</span>
                </label>
                <div className="price-input-wrapper">
                  <span className="price-prefix">£</span>
                  <input id="base-price" type="number" min={0} step={0.01} value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.00" className="price-input" />
                </div>
              </div>
            )}

            {ruleType === 'compare-at' && (
              <div className="field">
                <label htmlFor="compare-at">Compare-at price (original)</label>
                <div className="price-input-wrapper">
                  <span className="price-prefix">£</span>
                  <input id="compare-at" type="number" min={0} step={0.01} value={compareAt} onChange={e => setCompareAt(e.target.value)} placeholder="0.00" className="price-input" />
                </div>
                {savings && savingsPct && parseFloat(savings) > 0 && (
                  <div className="savings-preview">
                    <span>Customer saves</span>
                    <strong>£{savings}</strong>
                    <span className="savings-badge">–{savingsPct}%</span>
                  </div>
                )}
              </div>
            )}

            {ruleType === 'percentage' && (
              <div className="field">
                <label htmlFor="discount">Discount percentage <span className="req">*</span></label>
                <div className="price-input-wrapper">
                  <input id="discount" type="number" min={1} max={99} step={1} value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 20" className="price-input price-input--pct" />
                  <span className="price-suffix">%</span>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link href="/products/pricing" className="btn-ghost">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending && <span className="btn-spinner" aria-hidden="true" />}
              {isPending ? 'Saving…' : 'Save Rule'}
            </button>
          </div>
        </form>

        <aside className="new-pricing-tips">
          <div className="tips-card">
            <h3>Pricing guidance</h3>
            <ul>
              <li>Use <strong>Fixed price</strong> for standard retail pricing on individual products.</li>
              <li>Use <strong>Sale price</strong> to show a strikethrough original price alongside the sale price.</li>
              <li>Use <strong>Percentage off</strong> for blanket promotions across a category.</li>
              <li>Rules can be applied or overridden at the individual product level.</li>
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        .new-pricing-page { display: flex; flex-direction: column; gap: 28px; }

        .new-pricing-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .new-pricing-layout { grid-template-columns: 1fr; } }

        .new-pricing-form { display: flex; flex-direction: column; gap: 16px; }

        .form-error { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #FDF2F2; border: 1px solid #F5C6C6; border-radius: 8px; color: #C0392B; font-size: 0.875rem; }

        .form-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .form-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; }

        .field { display: flex; flex-direction: column; gap: 7px; }
        .field label { font-size: 0.875rem; font-weight: 500; color: #1A1A18; }
        .req { color: #C0392B; }

        input[type="text"], input[type="number"] { width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid #E8E6E1; border-radius: 10px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.9375rem; color: #1A1A18; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input:focus { border-color: #8B6914; box-shadow: 0 0 0 3px rgba(139,105,20,0.1); }
        input::placeholder { color: #B8B5AE; }

        .rule-type-options { display: flex; flex-direction: column; gap: 8px; }
        .rule-type-option { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1.5px solid #E8E6E1; border-radius: 10px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .rule-type-option input[type="radio"] { display: none; }
        .rule-type-option:hover { border-color: #C9A84C; background: #FFFDF7; }
        .rule-type-option--active { border-color: #8B6914; background: #FFFDF7; }
        .rule-type-option__icon { width: 36px; height: 36px; background: #F0EDE8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; color: #8B6914; flex-shrink: 0; }
        .rule-type-option--active .rule-type-option__icon { background: #F5E9C8; }
        .rule-type-option__body { display: flex; flex-direction: column; gap: 1px; }
        .rule-type-option__label { font-size: 0.875rem; font-weight: 600; color: #1A1A18; }
        .rule-type-option__desc { font-size: 0.75rem; color: #6B6B68; }

        .applies-to-options { display: flex; gap: 8px; flex-wrap: wrap; }
        .applies-option { display: flex; align-items: center; padding: 8px 14px; border: 1.5px solid #E8E6E1; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #1A1A18; transition: border-color 0.15s, background 0.15s; }
        .applies-option input[type="radio"] { display: none; }
        .applies-option:hover { border-color: #C9A84C; background: #FFFDF7; }
        .applies-option--active { border-color: #8B6914; background: #FFFDF7; }

        .price-input-wrapper { position: relative; display: flex; align-items: center; }
        .price-prefix { position: absolute; left: 14px; font-size: 1rem; font-weight: 600; color: #6B6B68; pointer-events: none; }
        .price-suffix { position: absolute; right: 14px; font-size: 1rem; font-weight: 600; color: #6B6B68; pointer-events: none; }
        .price-input { padding-left: 30px !important; font-family: 'DM Mono', monospace !important; font-size: 1rem !important; }
        .price-input--pct { padding-left: 14px !important; padding-right: 36px !important; }

        .savings-preview { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: #6B6B68; }
        .savings-preview strong { color: #27AE60; font-weight: 700; }
        .savings-badge { background: #EAF7EF; color: #27AE60; font-weight: 700; font-size: 0.8125rem; padding: 2px 8px; border-radius: 20px; }

        .form-actions { display: flex; justify-content: flex-end; gap: 10px; }

        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 20px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover:not(:disabled) { background: #2E2E2A; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-ghost { display: inline-flex; align-items: center; height: 40px; padding: 0 14px; background: none; border: none; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; color: #6B6B68; cursor: pointer; text-decoration: none; transition: color 0.15s; }
        .btn-ghost:hover { color: #1A1A18; }

        .btn-spinner { width: 15px; height: 15px; border: 2px solid rgba(245,240,232,0.3); border-top-color: #F5F0E8; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .tips-card { background: #FFFDF7; border: 1.5px solid #E8D9B0; border-radius: 14px; padding: 18px; }
        .tips-card h3 { font-size: 0.875rem; font-weight: 600; color: #8B6914; margin-bottom: 12px; }
        .tips-card ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 9px; }
        .tips-card li { font-size: 0.8125rem; color: #6B6B68; line-height: 1.5; padding-left: 14px; position: relative; }
        .tips-card li::before { content: '·'; position: absolute; left: 0; color: #C9A84C; font-size: 1.2rem; line-height: 1; top: 2px; font-weight: 700; }
        .tips-card strong { color: #1A1A18; font-weight: 600; }
      `}</style>
    </div>
  )
}