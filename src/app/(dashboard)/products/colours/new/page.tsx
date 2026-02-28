'use client'

import { useState, useTransition } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'

const PRESET_PALETTES = [
  { name: 'Arctic White', hex: '#F8F8F6' },
  { name: 'Cashmere', hex: '#D4C5B0' },
  { name: 'Warm Oak', hex: '#C8A87A' },
  { name: 'Sage Green', hex: '#7B9E87' },
  { name: 'Navy Blue', hex: '#1B2A4A' },
  { name: 'Graphite Grey', hex: '#5A5A5A' },
  { name: 'Midnight Black', hex: '#1A1A18' },
  { name: 'Dusky Pink', hex: '#D4A5A0' },
  { name: 'Slate Blue', hex: '#4A6B8A' },
  { name: 'Moss', hex: '#5C7A5A' },
  { name: 'Linen', hex: '#E8DDD0' },
  { name: 'Charcoal', hex: '#3A3A38' },
]

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export default function NewColourPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#C8A87A')
  const [hexInput, setHexInput] = useState('#C8A87A')
  const [category, setCategory] = useState<'both' | 'kitchen' | 'bedroom'>('both')
  const [error, setError] = useState<string | null>(null)

  function applyHexInput(value: string) {
    const normalized = value.startsWith('#') ? value : `#${value}`
    setHexInput(normalized)
    if (isValidHex(normalized)) {
      setHex(normalized)
    }
  }

  function selectPreset(preset: { name: string; hex: string }) {
    setHex(preset.hex)
    setHexInput(preset.hex)
    if (!name) setName(preset.name)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Colour name is required.'); return }
    if (!isValidHex(hex)) { setError('Please enter a valid 6-digit hex colour.'); return }

    startTransition(async () => {
      try {
        const res = await fetch('/api/products/colours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), hex, category }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message ?? 'Failed to create colour.')
          return
        }
        router.push('/products/colours')
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  const textColor = isLight(hex) ? '#1A1A18' : '#F5F0E8'

  return (
    <div className="new-colour-page">
      <PageHeader
        title="New Colour"
        description="Add a colour swatch to associate with kitchen and bedroom products."
        backHref="/products/colours"
        backLabel="Colours"
      />

      <div className="new-colour-layout">
        <form className="new-colour-form" onSubmit={handleSubmit} noValidate>
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
            <h2 className="form-card__title">Colour details</h2>

            <div className="field">
              <label htmlFor="colour-name">Name <span className="req">*</span></label>
              <input
                id="colour-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Arctic White"
                maxLength={60}
              />
            </div>

            <div className="field">
              <label>Category</label>
              <div className="cat-options">
                {[
                  { value: 'both', label: 'Both', desc: 'Kitchen & Bedroom' },
                  { value: 'kitchen', label: 'Kitchen only', desc: '' },
                  { value: 'bedroom', label: 'Bedroom only', desc: '' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`cat-option${category === opt.value ? ' cat-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={opt.value}
                      checked={category === opt.value as typeof category}
                      onChange={() => setCategory(opt.value as typeof category)}
                    />
                    <span className="cat-option__label">{opt.label}</span>
                    {opt.desc && <span className="cat-option__desc">{opt.desc}</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Hex code <span className="req">*</span></label>
              <div className="hex-input-row">
                <div className="hex-preview" style={{ background: hex }} aria-hidden="true" />
                <input
                  type="text"
                  value={hexInput}
                  onChange={e => applyHexInput(e.target.value)}
                  placeholder="#C8A87A"
                  maxLength={7}
                  className={`hex-text-input${!isValidHex(hexInput) && hexInput.length > 1 ? ' hex-text-input--error' : ''}`}
                />
                <input
                  type="color"
                  value={isValidHex(hex) ? hex : '#C8A87A'}
                  onChange={e => { setHex(e.target.value); setHexInput(e.target.value) }}
                  className="colour-picker-native"
                  title="Open colour picker"
                />
              </div>
              {!isValidHex(hexInput) && hexInput.length > 1 && (
                <span className="field-error">Enter a valid hex colour, e.g. #A3B4C5</span>
              )}
            </div>
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Preset palettes</h2>
            <p className="form-card__sub">Click a swatch to use it as a starting point.</p>
            <div className="preset-grid">
              {PRESET_PALETTES.map(preset => (
                <button
                  key={preset.hex}
                  type="button"
                  className={`preset-swatch${hex === preset.hex ? ' preset-swatch--active' : ''}`}
                  style={{ background: preset.hex }}
                  onClick={() => selectPreset(preset)}
                  title={preset.name}
                >
                  {hex === preset.hex && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <Link href="/products/colours" className="btn-ghost">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending && <span className="btn-spinner" aria-hidden="true" />}
              {isPending ? 'Saving…' : 'Save Colour'}
            </button>
          </div>
        </form>

        <aside className="new-colour-preview">
          <div className="preview-card">
            <h3 className="preview-card__title">Preview</h3>
            <div className="preview-swatch" style={{ background: hex }}>
              <div className="preview-swatch__info" style={{ color: textColor }}>
                <span className="preview-swatch__name">{name || 'Colour Name'}</span>
                <span className="preview-swatch__hex">{hex}</span>
              </div>
            </div>
            <div className="preview-meta">
              <div className="preview-meta__row">
                <span className="preview-meta__key">Category</span>
                <span className="preview-meta__val">
                  {category === 'both' ? 'Kitchen & Bedroom' : category === 'kitchen' ? 'Kitchen' : 'Bedroom'}
                </span>
              </div>
              <div className="preview-meta__row">
                <span className="preview-meta__key">Hex</span>
                <code className="preview-meta__code">{hex}</code>
              </div>
              <div className="preview-meta__row">
                <span className="preview-meta__key">Tone</span>
                <span className="preview-meta__val">{isLight(hex) ? 'Light' : 'Dark'}</span>
              </div>
            </div>
          </div>

          <div className="tips-card">
            <h3>Tips</h3>
            <ul>
              <li>Use the exact brand hex code to ensure accurate digital representation.</li>
              <li>Colours set to "Both" will appear in kitchen and bedroom product filters.</li>
              <li>You can reassign a colour's category at any time from the edit page.</li>
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        .new-colour-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .new-colour-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .new-colour-layout { grid-template-columns: 1fr; }
        }

        .new-colour-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #FDF2F2;
          border: 1px solid #F5C6C6;
          border-radius: 8px;
          color: #C0392B;
          font-size: 0.875rem;
        }

        .form-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-card__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.0625rem;
          font-weight: 700;
          color: #1A1A18;
        }

        .form-card__sub {
          font-size: 0.8125rem;
          color: #6B6B68;
          margin-top: -12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .req { color: #C0392B; }

        input[type="text"] {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.9375rem;
          color: #1A1A18;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        input[type="text"]:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
        }

        input::placeholder { color: #B8B5AE; }

        .cat-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cat-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .cat-option input[type="radio"] { display: none; }

        .cat-option:hover {
          border-color: #C9A84C;
          background: #FFFDF7;
        }

        .cat-option--active {
          border-color: #8B6914;
          background: #FFFDF7;
        }

        .cat-option__label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .cat-option__desc {
          font-size: 0.75rem;
          color: #6B6B68;
        }

        .hex-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hex-preview {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          border: 1.5px solid rgba(0,0,0,0.1);
          flex-shrink: 0;
          transition: background 0.15s;
        }

        .hex-text-input {
          flex: 1;
          font-family: 'DM Mono', monospace !important;
          letter-spacing: 0.05em;
        }

        .hex-text-input--error {
          border-color: #C0392B !important;
        }

        .colour-picker-native {
          width: 44px;
          height: 44px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          cursor: pointer;
          padding: 2px;
          background: #FFFFFF;
          flex-shrink: 0;
        }

        .field-error {
          font-size: 0.75rem;
          color: #C0392B;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }

        .preset-swatch {
          aspect-ratio: 1;
          border-radius: 8px;
          border: 2px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s, border-color 0.15s;
        }

        .preset-swatch:hover {
          transform: scale(1.08);
          border-color: rgba(0,0,0,0.15);
        }

        .preset-swatch--active {
          border-color: #8B6914 !important;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.2);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 40px;
          padding: 0 20px;
          background: #1A1A18;
          color: #F5F0E8;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-primary:hover:not(:disabled) { background: #2E2E2A; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          height: 40px;
          padding: 0 14px;
          background: none;
          border: none;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6B6B68;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s;
        }

        .btn-ghost:hover { color: #1A1A18; }

        .btn-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(245,240,232,0.3);
          border-top-color: #F5F0E8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .preview-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          overflow: hidden;
        }

        .preview-card__title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6B6B68;
          padding: 14px 16px 10px;
          border-bottom: 1px solid #F0EDE8;
        }

        .preview-swatch {
          height: 120px;
          display: flex;
          align-items: flex-end;
          padding: 14px;
          transition: background 0.2s;
        }

        .preview-swatch__info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: color 0.2s;
        }

        .preview-swatch__name {
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .preview-swatch__hex {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .preview-meta {
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-meta__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-meta__key {
          font-size: 0.8125rem;
          color: #6B6B68;
        }

        .preview-meta__val {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .preview-meta__code {
          font-family: 'DM Mono', monospace;
          font-size: 0.8125rem;
          color: #8B6914;
          background: #FFF8E6;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .tips-card {
          background: #FFFDF7;
          border: 1.5px solid #E8D9B0;
          border-radius: 14px;
          padding: 18px;
          margin-top: 14px;
        }

        .tips-card h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #8B6914;
          margin-bottom: 12px;
        }

        .tips-card ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .tips-card li {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.5;
          padding-left: 14px;
          position: relative;
        }

        .tips-card li::before {
          content: '·';
          position: absolute;
          left: 0;
          color: #C9A84C;
          font-size: 1.2rem;
          line-height: 1;
          top: 2px;
          font-weight: 700;
        }
      `}</style>
    </div>
  )
}