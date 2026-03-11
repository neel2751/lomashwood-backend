"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductImageUpload, type UploadedImage } from "@/components/products/ProductImageUpload";
import { useColours } from "@/hooks/useColours";
import { useProductFinishes } from "@/hooks/useProductFinishes";
import { usePackages } from "@/hooks/usePackages";
import { useProductStyles } from "@/hooks/useProductStyles";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useSizes } from "@/hooks/useSizes";
import { useToast } from "@/hooks/use-toast";

type ProductCategory = "kitchen" | "bedroom";

const TABS = ["Details", "Images", "Colours & Sizes", "Pricing", "SEO"] as const;
type Tab = (typeof TABS)[number];

type FormState = {
  title: string;
  description: string;
  category: ProductCategory | "";
  rangeName: string;
  packageId: string;
  styleId: string;
  finishId: string;
  status: "draft" | "active";
  price: string;
};

function mapImages(urls: string[] = []): UploadedImage[] {
  return urls.map((url, index) => ({
    id: `existing-${index}`,
    url,
    name: `image-${index + 1}`,
    size: 0,
    isPrimary: index === 0,
  }));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const router = useRouter();
  const toast = useToast();

  const { data: product, isLoading: isProductLoading, isError: isProductError } = useProduct(productId || "");
  const updateProduct = useUpdateProduct();

  const coloursQuery = useColours();
  const sizesQuery = useSizes();
  const packagesQuery = usePackages({ page: 1, limit: 200, isActive: true });
  const stylesQuery = useProductStyles({ page: 1, limit: 200, isActive: true });
  const finishesQuery = useProductFinishes({ page: 1, limit: 200, isActive: true });

  const [activeTab, setActiveTab] = useState<Tab>("Details");
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "",
    rangeName: "",
    packageId: "",
    styleId: "",
    finishId: "",
    status: "draft",
    price: "",
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedColourIds, setSelectedColourIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitIntent, setSubmitIntent] = useState<"save" | "draft" | "publish">("save");

  const isSaving = updateProduct.isPending;

  const styleOptions =
    ((stylesQuery.data as { data?: Array<{ id: string; name: string }> } | undefined)?.data ?? []);
  const packageOptions =
    ((packagesQuery.data as { data?: Array<{ id: string; title: string; category: ProductCategory; price?: number }> } | undefined)?.data ?? []);
  const finishOptions =
    ((finishesQuery.data as { data?: Array<{ id: string; name: string }> } | undefined)?.data ?? []);
  const colourOptions =
    ((coloursQuery.data as { data?: Array<{ id: string; name: string; hexCode: string }> } | undefined)?.data ?? []);
  const sizeOptions =
    ((sizesQuery.data as { data?: Array<{ id: string; title: string; description?: string }> } | undefined)?.data ?? []);

  useEffect(() => {
    if (!product) return;

    const record = product as {
      title?: string;
      description?: string;
      category?: ProductCategory;
      rangeName?: string;
      packageId?: string | null;
      styleId?: string | null;
      finishId?: string | null;
      isPublished?: boolean;
      price?: number | null;
      images?: string[];
      colours?: Array<{ id: string }>;
      sizes?: Array<{ id: string }>;
    };

    setForm({
      title: record.title || "",
      description: record.description || "",
      category: record.category || "",
      rangeName: record.rangeName || "",
      packageId: record.packageId || "",
      styleId: record.styleId || "",
      finishId: record.finishId || "",
      status: record.isPublished ? "active" : "draft",
      price: record.price ? String(record.price) : "",
    });
    setUploadedImages(mapImages(record.images || []));
    setSelectedColourIds((record.colours || []).map((item) => item.id));
    setSelectedSizeIds((record.sizes || []).map((item) => item.id));
  }, [product]);

  const productRecord = product as
    | {
        id?: string;
        title?: string;
        createdAt?: string;
        updatedAt?: string;
        style?: string | null;
        finish?: string | null;
      }
    | undefined;

  const pageTitle = useMemo(() => {
    if (!productRecord?.title) return "Edit Product";
    return `Edit ${productRecord.title}`;
  }, [productRecord?.title]);

  const seoSlug = useMemo(() => {
    const basis = [form.title, form.rangeName].filter(Boolean).join(" ");
    return slugify(basis || productRecord?.title || "product");
  }, [form.rangeName, form.title, productRecord?.title]);

  const metaTitle = useMemo(() => form.title.trim() || productRecord?.title || "", [form.title, productRecord?.title]);
  const metaDescription = useMemo(() => form.description.trim().slice(0, 160), [form.description]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!productId) return;
    if (!form.title.trim() || !form.description.trim() || !form.rangeName.trim() || !form.category) {
      setError("Title, category, range name, and description are required.");
      setActiveTab("Details");
      return;
    }

    const parsedPrice = Number(form.price);
    const nextPublishedState =
      submitIntent === "publish"
        ? true
        : submitIntent === "draft"
          ? false
          : form.status === "active";

    try {
      await updateProduct.mutateAsync({
        id: productId,
        payload: {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          rangeName: form.rangeName.trim(),
          packageId: form.packageId || null,
          images: uploadedImages.map((image) => image.url),
          price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : undefined,
          styleId: form.styleId || null,
          finishId: form.finishId || null,
          colourIds: selectedColourIds,
          sizeIds: selectedSizeIds,
          isPublished: nextPublishedState,
        },
      });

      toast.success(
        submitIntent === "publish"
          ? "Product published successfully"
          : submitIntent === "draft"
            ? "Product moved to draft"
            : "Product updated successfully",
      );
      router.push(`/products/${productId}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to update product.";
      setError(message);
      toast.error("Failed to update product");
    }
  }

  if (isProductLoading) {
    return <div className="p-6 text-sm text-[#6B6B68]">Loading product...</div>;
  }

  if (isProductError || !product) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Failed to load this product.</p>
        <Link href="/products" className="text-sm text-[#8B6914] underline">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      <div className="edit-product-page__topbar">
        <PageHeader
          title={pageTitle}
          description="Update product details, media, and linked catalogue options."
          backHref="/products"
          backLabel="Products"
        />
        <div className="edit-product-page__actions">
          <Link href={`/products/${productId}`} className="btn-ghost">View Product</Link>
          <Link href="/products" className="btn-ghost">Cancel</Link>
          <button
            className="btn-outline"
            form="edit-product-form"
            type="submit"
            onClick={() => setSubmitIntent("draft")}
            disabled={isSaving}
          >
            {isSaving && submitIntent === "draft" ? "Saving..." : "Move to Draft"}
          </button>
          {!form.status || form.status === "draft" ? (
            <button
              className="btn-outline"
              form="edit-product-form"
              type="submit"
              onClick={() => setSubmitIntent("publish")}
              disabled={isSaving}
            >
              {isSaving && submitIntent === "publish" ? "Publishing..." : "Publish Product"}
            </button>
          ) : null}
          <button
            className="btn-primary"
            form="edit-product-form"
            type="submit"
            onClick={() => setSubmitIntent("save")}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <form id="edit-product-form" onSubmit={handleSubmit}>
        <div className="edit-product-page__layout">
          <div className="edit-product-page__main">
            <div className="form-card">
              <div className="form-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`form-tab${activeTab === tab ? " form-tab--active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="form-tab-content">
                {activeTab === "Details" && (
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
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as ProductCategory | "" }))}
                        disabled={isSaving}
                      >
                        <option value="" disabled>Select a category</option>
                        <option value="kitchen">Kitchen</option>
                        <option value="bedroom">Bedroom</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="p-range">Range Name <span className="req">*</span></label>
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
                              {pkg.title}{typeof pkg.price === "number" ? ` (£${pkg.price.toLocaleString()})` : ""}
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
                          onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "draft" | "active" }))}
                          disabled={isSaving}
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Images" && (
                  <div className="tab-pane">
                    <p className="tab-intro">
                      Upload high-quality product images. The first image is used as the listing thumbnail and product hero image.
                    </p>
                    <ProductImageUpload
                      value={uploadedImages}
                      onChange={setUploadedImages}
                      uploadFolder="products"
                    />
                  </div>
                )}

                {activeTab === "Colours & Sizes" && (
                  <div className="tab-pane">
                    <div className="subsection">
                      <h3 className="subsection-title">Available Colours</h3>
                      <p className="subsection-desc">Select which colours this product is available in.</p>
                      <div className="colour-grid">
                        {colourOptions.length === 0 && (
                          <p className="empty-message">No colours found in database.</p>
                        )}
                        {colourOptions.map((colour) => (
                          <label key={colour.id} className="colour-option">
                            <input
                              type="checkbox"
                              checked={selectedColourIds.includes(colour.id)}
                              onChange={(event) => {
                                setSelectedColourIds((prev) =>
                                  event.target.checked
                                    ? [...prev, colour.id]
                                    : prev.filter((id) => id !== colour.id),
                                );
                              }}
                            />
                            <span
                              className="colour-swatch"
                              style={{
                                background: colour.hexCode,
                                border: colour.hexCode === "#FFFFFF" ? "1px solid #E0DDD8" : "none",
                              }}
                            />
                            <span className="colour-name">{colour.name}</span>
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
                              checked={selectedSizeIds.includes(size.id)}
                              onChange={(event) => {
                                setSelectedSizeIds((prev) =>
                                  event.target.checked
                                    ? [...prev, size.id]
                                    : prev.filter((id) => id !== size.id),
                                );
                              }}
                            />
                            <span className="size-option__title">{size.title}</span>
                            <span className="size-option__desc">{size.description || "No description"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Pricing" && (
                  <div className="tab-pane">
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="p-price">Base Price (£)</label>
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
                        <label>Configuration Summary</label>
                        <div className="summary-box">
                          <span>{selectedColourIds.length} colours linked</span>
                          <span>{selectedSizeIds.length} sizes linked</span>
                          <span>{uploadedImages.length} images uploaded</span>
                        </div>
                      </div>
                    </div>
                    <p className="tab-intro">
                      Additional pricing rules such as compare-at pricing or finance settings are not stored on products yet. Base price remains fully editable here.
                    </p>
                  </div>
                )}

                {activeTab === "SEO" && (
                  <div className="tab-pane">
                    <p className="tab-intro">
                      SEO metadata is not persisted on the product model yet. This preview helps admins check the title, description, and slug that would be generated from the current content.
                    </p>
                    <div className="field">
                      <label htmlFor="p-meta-title">Meta Title Preview</label>
                      <input id="p-meta-title" type="text" value={metaTitle} readOnly />
                      <span className="field-hint">{metaTitle.length}/60</span>
                    </div>
                    <div className="field">
                      <label htmlFor="p-meta-desc">Meta Description Preview</label>
                      <textarea id="p-meta-desc" rows={3} value={metaDescription} readOnly />
                      <span className="field-hint">{metaDescription.length}/160</span>
                    </div>
                    <div className="field">
                      <label htmlFor="p-slug">URL Slug Preview</label>
                      <div className="input-prefix-wrapper">
                        <span className="input-prefix input-prefix--long">/products/</span>
                        <input id="p-slug" type="text" className="input-prefixed" value={seoSlug} readOnly />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="edit-product-page__sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-card__title">Product Status</h3>
              <div className={`status-indicator${form.status === "active" ? " status-indicator--active" : " status-indicator--draft"}`}>
                <span className="status-dot" />
                {form.status === "active" ? "Published" : "Draft"}
              </div>
              <p className="sidebar-card__hint">
                {form.status === "active"
                  ? "This product is currently visible to customers."
                  : "Draft products remain hidden until an admin publishes them."}
              </p>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-card__title">Visibility</h3>
              <div className="sidebar-list">
                <span>Website: {form.status === "active" ? "Visible" : "Hidden"}</span>
                <span>Primary image: {uploadedImages[0] ? "Ready" : "Missing"}</span>
                <span>Catalogue completeness: {selectedColourIds.length > 0 && selectedSizeIds.length > 0 ? "Good" : "Needs options"}</span>
              </div>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-card__title">Organisation</h3>
              <div className="sidebar-list">
                <span>Product ID: {productRecord?.id || "-"}</span>
                <span>Package: {packageOptions.find((item) => item.id === form.packageId)?.title || "Not assigned"}</span>
                <span>Style: {styleOptions.find((item) => item.id === form.styleId)?.name || productRecord?.style || "Not set"}</span>
                <span>Finish: {finishOptions.find((item) => item.id === form.finishId)?.name || productRecord?.finish || "Not set"}</span>
                <span>Created: {formatDate(productRecord?.createdAt)}</span>
                <span>Updated: {formatDate(productRecord?.updatedAt)}</span>
              </div>
            </div>
          </aside>
        </div>
      </form>

      <style>{`
        .edit-product-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .edit-product-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .edit-product-page__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding-top: 4px;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          height: 38px; padding: 0 16px;
          background: #1A1A18; color: #F5F0E8;
          border: none; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s; white-space: nowrap;
          text-decoration: none;
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
          text-decoration: none;
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

        .edit-product-page__layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .edit-product-page__layout { grid-template-columns: 1fr; }
        }

        .edit-product-page__main {
          min-width: 0;
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

        @media (max-width: 640px) {
          .field-row { grid-template-columns: 1fr; }
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

        input[readonly], textarea[readonly] {
          background: #FAFAF8;
          color: #6B6B68;
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

        .size-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        @media (max-width: 640px) {
          .size-list { grid-template-columns: 1fr; }
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

        .summary-box {
          min-height: 44px;
          padding: 12px 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          background: #FAFAF8;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.875rem;
          color: #6B6B68;
        }

        .edit-product-page__sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
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
        }

        .status-indicator--draft { color: #6B6B68; }
        .status-indicator--active { color: #1F7A45; }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
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
  );
}