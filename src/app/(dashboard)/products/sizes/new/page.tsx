'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'

export default function NewSizePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'kitchen' | 'bedroom' | 'both'>('kitchen')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [depth, setDepth] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Name is required.'); return }
    if (!width || !height || !depth) { setError('Width, height, and depth are all required.'); return }

    startTransition(async () => {
      try {
        const res = await fetch('/api/products/sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), category, width: Number(width), height: Number(height), depth: Number(depth), description }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message ?? 'Failed to create size.')
          return
        }
        router.push('/products/sizes')
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="new-size-page">
      <PageHeader
        title="New Size / Unit"
        description="Define dimensions for a kitchen or bedroom unit type."
        backHref="/products/sizes"
        backLabel="Sizes"
      />

      <div className="new-size-layout">
        <form className="new-size-form" onSubmit={handleSubmit} noValidate>
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
            <h2 className="form-card__title">Unit details</h2>

            <div className="field">
              <label htmlFor="size-name">Name <span className="req">*</span></label>
              <input id="size-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Base Unit 600mm" maxLength={80} />
            </div>

            <div className="field">
              <label>Category</label>
              <div className="cat-options">
                {[
                  { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
                  { value: 'bedroom', label: 'Bedroom', icon: '🛏' },
                  { value: 'both',    label: 'Both',    icon: '🏠' },
                ].map(opt => (
                  <label key={opt.value} className={`cat-option${category === opt.value ? ' cat-option--active' : ''}`}>
                    <input type="radio" name="category" value={opt.value} checked={category === opt.value as typeof category} onChange={() => setCategory(opt.value as typeof category)} />
                    <span className="cat-option__icon">{opt.icon}</span>
                    <span className="cat-option__label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description of this unit type…" rows={3} maxLength={200} />
            </div>
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Dimensions</h2>
            <p className="form-card__sub">All measurements in millimetres (mm).</p>

            <div className="dims-grid">
              {[
                { id: 'width',  label: 'Width',  value: width,  setter: setWidth,  placeholder: 'e.g. 600' },
                { id: 'height', label: 'Height', value: height, setter: setHeight, placeholder: 'e.g. 870' },
                { id: 'depth',  label: 'Depth',  value: depth,  setter: setDepth,  placeholder: 'e.g. 560' },
              ].map(dim => (
                <div key={dim.id} className="field">
                  <label htmlFor={`dim-${dim.id}`}>{dim.label} <span className="req">*</span></label>
                  <div className="dim-input-wrapper">
                    <input
                      id={`dim-${dim.id}`}
                      type="number"
                      min={1}
                      max={9999}
                      value={dim.value}
                      onChange={e => dim.setter(e.target.value)}
                      placeholder={dim.placeholder}
                    />
                    <span className="dim-unit">mm</span>
                  </div>
                </div>
              ))}
            </div>

            {width && height && depth && (
              <div className="dims-preview">
                <svg viewBox="0 0 120 80" className="dims-svg" aria-hidden="true">
                  <rect x="20" y="20" width="80" height="50" rx="3" fill="#F7F5F0" stroke="#C9A84C" strokeWidth="1.5"/>
                  <text x="60" y="45" textAnchor="middle" fontSize="10" fill="#8B6914" fontFamily="DM Mono, monospace">{width}mm</text>
                  <text x="60" y="58" textAnchor="middle" fontSize="8" fill="#6B6B68" fontFamily="DM Mono, monospace">H: {height} · D: {depth}</text>
                </svg>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link href="/products/sizes" className="btn-ghost">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending && <span className="btn-spinner" aria-hidden="true" />}
              {isPending ? 'Saving…' : 'Save Size'}
            </button>
          </div>
        </form>

        <aside className="new-size-tips">
          <div className="tips-card">
            <h3>Dimension guide</h3>
            <ul>
              <li><strong>Base units</strong> are typically 870mm tall, 560mm deep, and range from 300–1200mm wide.</li>
              <li><strong>Wall units</strong> are typically 720mm tall and 320mm deep.</li>
              <li><strong>Tall units</strong> are typically 2100–2200mm tall.</li>
              <li><strong>Wardrobes</strong> are typically 2200mm tall and 600mm deep.</li>
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        .new-size-page { display: flex; flex-direction: column; gap: 28px; }

        .new-size-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .new-size-layout { grid-template-columns: 1fr; } }

        .new-size-form { display: flex; flex-direction: column; gap: 16px; }

        .form-error { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #FDF2F2; border: 1px solid #F5C6C6; border-radius: 8px; color: #C0392B; font-size: 0.875rem; }

        .form-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .form-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; }
        .form-card__sub { font-size: 0.8125rem; color: #6B6B68; margin-top: -12px; }

        .field { display: flex; flex-direction: column; gap: 7px; }
        .field label { font-size: 0.875rem; font-weight: 500; color: #1A1A18; }
        .req { color: #C0392B; }

        input[type="text"], input[type="number"], textarea {
          width: 100%; padding: 10px 14px; border: 1.5px solid #E8E6E1; border-radius: 10px;
          background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.9375rem;
          color: #1A1A18; outline: none; transition: border-color 0.15s, box-shadow 0.15s; resize: vertical;
        }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input:focus, textarea:focus { border-color: #8B6914; box-shadow: 0 0 0 3px rgba(139,105,20,0.1); }
        input::placeholder, textarea::placeholder { color: #B8B5AE; }

        .cat-options { display: flex; gap: 8px; flex-wrap: wrap; }
        .cat-option { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1.5px solid #E8E6E1; border-radius: 10px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .cat-option input[type="radio"] { display: none; }
        .cat-option:hover { border-color: #C9A84C; background: #FFFDF7; }
        .cat-option--active { border-color: #8B6914; background: #FFFDF7; }
        .cat-option__icon { font-size: 1rem; }
        .cat-option__label { font-size: 0.875rem; font-weight: 500; color: #1A1A18; }

        .dims-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 600px) { .dims-grid { grid-template-columns: 1fr; } }

        .dim-input-wrapper { position: relative; }
        .dim-input-wrapper input { padding-right: 42px; }
        .dim-unit {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          font-size: 0.75rem; font-weight: 600; color: #6B6B68; pointer-events: none;
        }

        .dims-preview {
          background: #F7F5F0; border-radius: 10px; padding: 16px;
          display: flex; justify-content: center;
        }
        .dims-svg { width: 120px; height: 80px; }

        .form-actions { display: flex; justify-content: flex-end; gap: 10px; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 20px;
          background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-primary:hover:not(:disabled) { background: #2E2E2A; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-ghost {
          display: inline-flex; align-items: center; height: 40px; padding: 0 14px;
          background: none; border: none; font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 500; color: #6B6B68; cursor: pointer;
          text-decoration: none; transition: color 0.15s;
        }
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