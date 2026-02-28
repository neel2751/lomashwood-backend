'use client'

import { useState, useTransition } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'

export default function NewCategoryPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    type: '' as 'kitchen' | 'bedroom' | '',
    description: '',
    slug: '',
    metaTitle: '',
    metaDesc: '',
  })

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setForm((f) => ({ ...f, name, slug }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.type) {
      setError('Name and type are required.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/products/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message ?? 'Failed to create category.')
          return
        }
        router.push('/products/categories')
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="new-cat-page">
      <div className="new-cat-page__topbar">
        <PageHeader
          title="New Category"
          description="Create a new product category to organise your catalogue."
          backHref="/products/categories"
          backLabel="Categories"
        />
        <div className="new-cat-page__actions">
          <Link href="/products/categories" className="btn-ghost">Discard</Link>
          <button
            form="category-form"
            type="submit"
            className="btn-primary"
            disabled={isPending}
          >
            {isPending && <span className="spinner" aria-hidden="true" />}
            {isPending ? 'Saving…' : 'Save Category'}
          </button>
        </div>
      </div>

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

      <div className="new-cat-page__layout">
        <form id="category-form" className="form-card" onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <h2 className="form-section__title">Details</h2>
            <div className="field">
              <label htmlFor="cat-name">Category Name <span className="req">*</span></label>
              <input
                id="cat-name"
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Kitchen"
                required
                disabled={isPending}
              />
            </div>

            <div className="field">
              <label>Type <span className="req">*</span></label>
              <div className="type-options">
                {[
                  { value: 'kitchen', label: 'Kitchen', icon: '🍳', desc: 'All kitchen products and ranges' },
                  { value: 'bedroom', label: 'Bedroom', icon: '🛏', desc: 'All bedroom products and fitted furniture' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`type-option${form.type === opt.value ? ' type-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={opt.value}
                      checked={form.type === opt.value}
                      onChange={() => setForm((f) => ({ ...f, type: opt.value as 'kitchen' | 'bedroom' }))}
                    />
                    <span className="type-option__icon">{opt.icon}</span>
                    <span className="type-option__body">
                      <span className="type-option__label">{opt.label}</span>
                      <span className="type-option__desc">{opt.desc}</span>
                    </span>
                    {form.type === opt.value && (
                      <span className="type-option__check" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="cat-desc">Description</label>
              <textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional — shown on the category page on the website."
                rows={3}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-section">
            <h2 className="form-section__title">SEO</h2>
            <div className="field">
              <label htmlFor="cat-slug">URL Slug</label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">/products/</span>
                <input
                  id="cat-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="kitchen"
                  className="input-prefixed"
                  disabled={isPending}
                />
              </div>
              <span className="field-hint">Auto-generated from name. Edit to customise.</span>
            </div>

            <div className="field">
              <label htmlFor="cat-meta-title">Meta Title</label>
              <input
                id="cat-meta-title"
                type="text"
                value={form.metaTitle}
                onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                placeholder="Leave blank to use category name"
                maxLength={60}
                disabled={isPending}
              />
              <span className="field-hint">{form.metaTitle.length}/60</span>
            </div>

            <div className="field">
              <label htmlFor="cat-meta-desc">Meta Description</label>
              <textarea
                id="cat-meta-desc"
                value={form.metaDesc}
                onChange={(e) => setForm((f) => ({ ...f, metaDesc: e.target.value }))}
                placeholder="Brief description for search engines…"
                rows={2}
                maxLength={160}
                disabled={isPending}
              />
              <span className="field-hint">{form.metaDesc.length}/160</span>
            </div>
          </div>
        </form>

        <aside className="new-cat-page__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">About Categories</h3>
            <p className="sidebar-card__text">
              Categories are the top-level groupings for products — currently
              Kitchen and Bedroom. Each product must belong to one category.
            </p>
            <p className="sidebar-card__text">
              The category type controls which filter pages and navigation links
              the product will appear on.
            </p>
          </div>
        </aside>
      </div>

      <style>{`
        .new-cat-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .new-cat-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .new-cat-page__actions {
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
          cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }

        .btn-primary:hover:not(:disabled) { background: #2E2E2A; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-ghost {
          display: inline-flex; align-items: center;
          height: 38px; padding: 0 12px;
          background: none; border: none;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 500;
          color: #6B6B68; cursor: pointer; text-decoration: none;
          transition: color 0.15s;
        }

        .btn-ghost:hover { color: #1A1A18; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(245,240,232,0.3);
          border-top-color: #F5F0E8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .form-error {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px;
          background: #FDF2F2; border: 1px solid #F5C6C6; border-radius: 8px;
          color: #C0392B; font-size: 0.875rem;
        }

        .new-cat-page__layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .new-cat-page__layout { grid-template-columns: 1fr; }
        }

        .form-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .form-section { display: flex; flex-direction: column; gap: 18px; padding: 4px 0; }

        .form-section__title {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .form-divider {
          height: 1.5px;
          background: #F0EDE8;
          margin: 22px 0;
        }

        .field { display: flex; flex-direction: column; gap: 6px; }

        .field label {
          font-size: 0.875rem; font-weight: 500; color: #1A1A18;
        }

        .req { color: #C0392B; }

        .field-hint { font-size: 0.75rem; color: #B8B5AE; }

        input[type="text"], textarea {
          width: 100%; padding: 9px 14px;
          border: 1.5px solid #E8E6E1; border-radius: 10px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.9375rem; color: #1A1A18;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          resize: vertical;
        }

        input:focus, textarea:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.1);
        }

        input::placeholder, textarea::placeholder { color: #B8B5AE; }
        input:disabled, textarea:disabled { opacity: 0.55; }

        .type-options { display: flex; flex-direction: column; gap: 8px; }

        .type-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          position: relative;
        }

        .type-option input[type="radio"] { display: none; }

        .type-option:hover { border-color: #C9A84C; background: #FFFDF7; }

        .type-option--active {
          border-color: #8B6914;
          background: #FFFDF7;
        }

        .type-option__icon {
          font-size: 1.5rem;
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: #F7F5F0;
          border-radius: 10px;
          border: 1px solid #E8E0D0;
          flex-shrink: 0;
        }

        .type-option__body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .type-option__label {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .type-option__desc {
          font-size: 0.8125rem;
          color: #6B6B68;
        }

        .type-option__check {
          width: 22px; height: 22px;
          background: #8B6914;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .input-prefix-wrapper { display: flex; align-items: stretch; }

        .input-prefix {
          display: flex; align-items: center;
          padding: 0 10px;
          background: #F0EDE8;
          border: 1.5px solid #E8E6E1; border-right: none;
          border-radius: 10px 0 0 10px;
          font-size: 0.8125rem; color: #6B6B68; font-weight: 500;
          white-space: nowrap;
        }

        .input-prefixed { border-radius: 0 10px 10px 0 !important; }

        .sidebar-card {
          background: #FFFDF7;
          border: 1.5px solid #E8D9B0;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-card__title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #8B6914;
        }

        .sidebar-card__text {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.6;
        }
      `}</style>
    </div>
  )
}