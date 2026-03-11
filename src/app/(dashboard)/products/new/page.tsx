"use client"

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductImageUpload, type UploadedImage } from '@/components/products/ProductImageUpload'
import { useColours } from '@/hooks/useColours'
import { useProductFinishes } from '@/hooks/useProductFinishes'
import { usePackages } from '@/hooks/usePackages'
import { useProductStyles } from '@/hooks/useProductStyles'
import { useCreateProduct } from '@/hooks/useProducts'
import { useSizes } from '@/hooks/useSizes'
import { useToast } from '@/hooks/use-toast'


const TABS = ['Details', 'Images', 'Colours & Sizes', 'Pricing', 'SEO'] as const
type Tab = typeof TABS[number]

export default function NewProductPage() {
  const router = useRouter()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('Details')
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'publish'>('draft')
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedColourIds, setSelectedColourIds] = useState<string[]>([])
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    category: '' as 'kitchen' | 'bedroom' | '',
    rangeName: '',
    packageId: '',
    description: '',
    styleId: '',
    finishId: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    price: '',
  })

  const createProduct = useCreateProduct()
  const coloursQuery = useColours()
  const sizesQuery = useSizes()
  const packagesQuery = usePackages({ page: 1, limit: 200, isActive: true })
  const stylesQuery = useProductStyles({ page: 1, limit: 100 })
  const finishesQuery = useProductFinishes({ page: 1, limit: 100})

  console.log('Styles:', stylesQuery.data)
  console.log('Finishes:', finishesQuery.data)

  const styleOptions =
    ((stylesQuery.data as { data?: Array<{ id: string; name: string }> } | undefined)?.data ?? [])

  const packageOptions =
    ((packagesQuery.data as { data?: Array<{ id: string; title: string; category: 'kitchen' | 'bedroom'; price?: number }> } | undefined)?.data ?? [])

  const finishOptions =
    ((finishesQuery.data as { data?: Array<{ id: string; name: string }> } | undefined)?.data ?? [])

  const colourOptions =
    ((coloursQuery.data as { data?: Array<{ id: string; name: string; hexCode: string }> } | undefined)?.data ?? [])

  const sizeOptions =
    ((sizesQuery.data as { data?: Array<{ id: string; title: string; description?: string }> } | undefined)?.data ?? [])

  const isSaving = createProduct.isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!form.title.trim() || !form.description.trim() || !form.rangeName.trim() || !form.category) {
      setError('Title, category, range name, and description are required.')
      setActiveTab('Details')
      return
    }

    const isPublished = submitIntent === 'publish' || form.status === 'active'
    const parsedPrice = Number(form.price)

    try {
      const created = await createProduct.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        rangeName: form.rangeName.trim(),
        packageId: form.packageId || undefined,
        images: uploadedImages.map((image) => image.url),
        price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined,
        styleId: form.styleId || undefined,
        finishId: form.finishId || undefined,
        colourIds: selectedColourIds,
        sizeIds: selectedSizeIds,
        isPublished,
      }) as { id?: string }

      toast.success('Product created successfully')
      router.push(created?.id ? `/products/${created.id}` : '/products')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create product.')
      toast.error('Failed to create product')
    }
  }

  return (
    <div className="new-product-page">
      <div className="new-product-page__topbar">
        <PageHeader
          title="Add Product"
          description="Create a new kitchen or bedroom product for the catalogue."
          backHref="/products"
          backLabel="Products"
        />
        <div className="new-product-page__actions">
          <Link href="/products" className="btn-ghost">Discard</Link>
          <button
            className="btn-outline"
            form="new-product-form"
            type="submit"
            onClick={() => setSubmitIntent('draft')}
            disabled={isSaving}
          >
            {isSaving && submitIntent === 'draft' ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            className="btn-primary"
            form="new-product-form"
            type="submit"
            onClick={() => setSubmitIntent('publish')}
            disabled={isSaving}
          >
            {isSaving && submitIntent === 'publish' ? 'Publishing...' : 'Publish Product'}
          </button>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <form id="new-product-form" onSubmit={handleSubmit}>
      <div className="new-product-page__layout">
        <div className="new-product-page__main">
          <div className="form-card">
            <div className="form-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`form-tab${activeTab === tab ? ' form-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="form-tab-content">
              {activeTab === 'Details' && (
                <div className="tab-pane">
                  <div className="field">
                    <label htmlFor="p-title">Product Title <span className="req">*</span></label>
                    <input
                      id="p-title"
                      type="text"
                      placeholder="e.g. Ashford Shaker Kitchen"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="p-category">Category <span className="req">*</span></label>
                    <select
                      id="p-category"
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as 'kitchen' | 'bedroom' | '' }))}
                      disabled={isSaving}
                    >
                      <option value="" disabled>Select a category</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="bedroom">Bedroom</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="p-range">Range Name</label>
                    <input
                      id="p-range"
                      type="text"
                      placeholder="e.g. Shaker Collection"
                      value={form.rangeName}
                      onChange={(e) => setForm((prev) => ({ ...prev, rangeName: e.target.value }))}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="p-package">Package</label>
                    <select
                      id="p-package"
                      value={form.packageId}
                      onChange={(e) => setForm((prev) => ({ ...prev, packageId: e.target.value }))}
                      disabled={isSaving || packagesQuery.isLoading}
                    >
                      <option value="">No package</option>
                      {packageOptions
                        .filter((pkg) => !form.category || pkg.category === form.category)
                        .map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.title}{typeof pkg.price === 'number' ? ` (£${pkg.price.toLocaleString()})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="p-desc">Description <span className="req">*</span></label>
                    <textarea
                      id="p-desc"
                      rows={5}
                      placeholder="Describe the product in detail. Include style, materials, and key features."
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="p-style">Style</label>
                    <select
                      id="p-style"
                      value={form.styleId}
                      onChange={(e) => setForm((prev) => ({ ...prev, styleId: e.target.value }))}
                      disabled={isSaving || stylesQuery.isLoading}
                    >
                      <option value="">Select style</option>
                      {styleOptions.map((style) => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="p-finish">Finish</label>
                      <select
                        id="p-finish"
                        value={form.finishId}
                        onChange={(e) => setForm((prev) => ({ ...prev, finishId: e.target.value }))}
                        disabled={isSaving || finishesQuery.isLoading}
                      >
                        <option value="">Select finish</option>
                        {finishOptions.map((finish) => (
                          <option key={finish.id} value={finish.id}>{finish.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="p-status">Status</label>
                      <select
                        id="p-status"
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'draft' | 'active' | 'archived' }))}
                        disabled={isSaving}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Images' && (
                <div className="tab-pane">
                  <p className="tab-intro">
                    Upload high-quality product images. The first image will be used as the listing thumbnail.
                    Recommended: 1200 × 900 px, JPG or WebP.
                  </p>
                  <ProductImageUpload
                    value={uploadedImages}
                    onChange={setUploadedImages}
                    uploadFolder="products"
                  />
                </div>
              )}

              {activeTab === 'Colours & Sizes' && (
                <div className="tab-pane">
                  <div className="subsection">
                    <h3 className="subsection-title">Available Colours</h3>
                    <p className="subsection-desc">Select which colours this product is available in.</p>
                    <div className="colour-grid">
                      {colourOptions.length === 0 && (
                        <p className="empty-message">No colours found in database.</p>
                      )}
                      {colourOptions.map((c) => (
                        <label key={c.id} className="colour-option">
                          <input
                            type="checkbox"
                            name="colours"
                            value={c.id}
                            checked={selectedColourIds.includes(c.id)}
                            onChange={(event) => {
                              setSelectedColourIds((prev) =>
                                event.target.checked
                                  ? [...prev, c.id]
                                  : prev.filter((id) => id !== c.id),
                              )
                            }}
                          />
                          <span
                            className="colour-swatch"
                            style={{ background: c.hexCode, border: c.hexCode === '#FFFFFF' ? '1px solid #E0DDD8' : 'none' }}
                          />
                          <span className="colour-name">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="subsection">
                    <h3 className="subsection-title">Units / Sizes</h3>
                    <p className="subsection-desc">Select available unit sizes from the database.</p>
                    <div className="size-list">
                      {sizeOptions.length === 0 && (
                        <p className="empty-message">No sizes found in database.</p>
                      )}
                      {sizeOptions.map((size) => (
                        <label key={size.id} className="size-option">
                          <input
                            type="checkbox"
                            name="sizes"
                            value={size.id}
                            checked={selectedSizeIds.includes(size.id)}
                            onChange={(event) => {
                              setSelectedSizeIds((prev) =>
                                event.target.checked
                                  ? [...prev, size.id]
                                  : prev.filter((id) => id !== size.id),
                              )
                            }}
                          />
                          <span className="size-option__title">{size.title}</span>
                          <span className="size-option__desc">{size.description || 'No description'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Pricing' && (
                <div className="tab-pane">
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="p-price">Base Price (£) <span className="req">*</span></label>
                      <div className="input-prefix-wrapper">
                        <span className="input-prefix">£</span>
                        <input
                          id="p-price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="input-prefixed"
                          value={form.price}
                          onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="p-compare-price">Compare-at Price (£)</label>
                      <div className="input-prefix-wrapper">
                        <span className="input-prefix">£</span>
                        <input id="p-compare-price" type="number" min="0" step="0.01" placeholder="0.00" className="input-prefixed" />
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      Show estimated price range on product page
                    </label>
                  </div>
                  <div className="field">
                    <label htmlFor="p-finance">Finance Available</label>
                    <select id="p-finance" defaultValue="yes">
                      <option value="yes">Yes — link to finance page</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'SEO' && (
                <div className="tab-pane">
                  <div className="field">
                    <label htmlFor="p-meta-title">Meta Title</label>
                    <input id="p-meta-title" type="text" placeholder="Leave blank to use product title" maxLength={60} />
                    <span className="field-hint">0/60</span>
                  </div>
                  <div className="field">
                    <label htmlFor="p-meta-desc">Meta Description</label>
                    <textarea id="p-meta-desc" rows={3} placeholder="Brief description for search engines…" maxLength={160} />
                    <span className="field-hint">0/160</span>
                  </div>
                  <div className="field">
                    <label htmlFor="p-slug">URL Slug</label>
                    <div className="input-prefix-wrapper">
                      <span className="input-prefix input-prefix--long">/products/</span>
                      <input id="p-slug" type="text" placeholder="ashford-shaker-kitchen" className="input-prefixed" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="new-product-page__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Product Status</h3>
            <div className="status-indicator status-indicator--draft">
              <span className="status-dot" />
              Draft
            </div>
            <p className="sidebar-card__hint">
              Draft products are not visible on the website until published.
            </p>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Visibility</h3>
            <div className="field">
              <select defaultValue="all">
                <option value="all">All customers</option>
                <option value="trade">Trade only</option>
              </select>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Organisation</h3>
            <div className="field">
              <label>Package</label>
              <input
                type="text"
                value={packageOptions.find((pkg) => pkg.id === form.packageId)?.title || 'Not assigned'}
                readOnly
              />
            </div>
            <div className="field">
              <label>Tags</label>
              <input type="text" placeholder="Add tags, comma-separated" />
            </div>
          </div>
        </aside>
      </div>
      </form>

      <style>{`
        .new-product-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .new-product-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .new-product-page__actions {
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

        .btn-primary:hover { background: #2E2E2A; }

        .btn-outline {
          display: inline-flex; align-items: center;
          height: 38px; padding: 0 14px;
          background: #FFFFFF; color: #1A1A18;
          border: 1.5px solid #E8E6E1; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: border-color 0.15s; white-space: nowrap;
        }

        .btn-outline:hover { border-color: #1A1A18; }
        .btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }

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

        .form-error {
          border: 1.5px solid #F5C6C6;
          background: #FDF6F6;
          color: #A93226;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .new-product-page__layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .new-product-page__layout { grid-template-columns: 1fr; }
        }

        .form-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          overflow: hidden;
        }

        .form-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1.5px solid #E8E6E1;
          background: #FAFAF8;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .form-tabs::-webkit-scrollbar { display: none; }

        .form-tab {
          height: 44px;
          padding: 0 18px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1.5px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6B6B68;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.15s, border-color 0.15s;
        }

        .form-tab:hover { color: #1A1A18; }

        .form-tab--active {
          color: #1A1A18;
          border-bottom-color: #8B6914;
          font-weight: 600;
          background: #FFFFFF;
        }

        .form-tab-content { padding: 24px; }

        .tab-pane { display: flex; flex-direction: column; gap: 20px; }

        .tab-intro {
          font-size: 0.875rem;
          color: #6B6B68;
          line-height: 1.6;
          background: #F7F5F0;
          border: 1px solid #E8E0D0;
          border-radius: 8px;
          padding: 12px 14px;
        }

        .field { display: flex; flex-direction: column; gap: 6px; }

        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .req { color: #C0392B; }

        .field-hint {
          font-size: 0.75rem;
          color: #B8B5AE;
          text-align: right;
          margin-top: -2px;
        }

        input[type="text"],
        input[type="number"],
        textarea,
        select {
          width: 100%;
          padding: 9px 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.9375rem;
          color: #1A1A18;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          resize: vertical;
          appearance: none;
        }

        select {
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }

        input:focus, textarea:focus, select:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.1);
        }

        input::placeholder, textarea::placeholder { color: #B8B5AE; }

        .input-prefix-wrapper {
          display: flex;
          align-items: stretch;
        }

        .input-prefix {
          display: flex;
          align-items: center;
          padding: 0 12px;
          background: #F0EDE8;
          border: 1.5px solid #E8E6E1;
          border-right: none;
          border-radius: 10px 0 0 10px;
          font-size: 0.875rem;
          color: #6B6B68;
          font-weight: 500;
          white-space: nowrap;
        }

        .input-prefix--long { padding: 0 10px; }

        .input-prefixed {
          border-radius: 0 10px 10px 0 !important;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1A1A18;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          cursor: pointer;
          border-radius: 4px;
        }

        .subsection { display: flex; flex-direction: column; gap: 12px; }

        .subsection-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .subsection-desc {
          font-size: 0.8125rem;
          color: #6B6B68;
          margin-top: -4px;
        }

        .colour-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        @media (max-width: 640px) {
          .colour-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .colour-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .colour-option:has(input:checked) {
          border-color: #8B6914;
          background: #FFFDF7;
        }

        .colour-option input[type="checkbox"] {
          display: none;
        }

        .colour-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .colour-name {
          font-size: 0.75rem;
          font-weight: 500;
          color: #1A1A18;
          line-height: 1.3;
        }

        .btn-add-unit {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 36px;
          padding: 0 14px;
          background: #F0EDE8;
          border: 1.5px dashed #C8C4BC;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #6B6B68;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          align-self: flex-start;
        }

        .btn-add-unit:hover {
          border-color: #8B6914;
          color: #8B6914;
        }

        .size-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .size-option {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          background: #FFFFFF;
        }

        .size-option:has(input:checked) {
          border-color: #8B6914;
          background: #FFFDF7;
        }

        .size-option input[type="checkbox"] {
          display: none;
        }

        .size-option__title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .size-option__desc {
          font-size: 0.75rem;
          color: #6B6B68;
        }

        .empty-message {
          font-size: 0.8125rem;
          color: #6B6B68;
          grid-column: 1 / -1;
        }

        .sidebar-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-card__title {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .sidebar-card__hint {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.5;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #6B6B68;
        }

        .status-indicator--draft .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #B8B5AE;
        }

        .new-product-page__sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
      `}</style>
    </div>
  )
}

export const dynamic = 'force-dynamic'
