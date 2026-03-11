"use client";

import { useMemo, useState } from "react";

import type { CreatePackagePayload, ProductCategory } from "@/types/product.types";

type PackageFormValues = {
  title: string;
  description: string;
  image: string;
  category: ProductCategory;
  price: string;
  featuresText: string;
  isActive: boolean;
};

interface PackageFormProps {
  initialValues?: Partial<PackageFormValues>;
  isSaving?: boolean;
  submitLabel: string;
  onSubmit: (payload: CreatePackagePayload) => Promise<void> | void;
}

function normalizeFeatures(featuresText: string) {
  return featuresText
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PackageForm({ initialValues, isSaving = false, submitLabel, onSubmit }: PackageFormProps) {
  const [values, setValues] = useState<PackageFormValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    image: initialValues?.image ?? "",
    category: initialValues?.category ?? "kitchen",
    price: initialValues?.price ?? "",
    featuresText: initialValues?.featuresText ?? "",
    isActive: initialValues?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  const featurePreview = useMemo(() => normalizeFeatures(values.featuresText), [values.featuresText]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError("Package title is required.");
      return;
    }

    const parsedPrice = Number(values.price);

    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      image: values.image.trim() || undefined,
      category: values.category,
      price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined,
      features: normalizeFeatures(values.featuresText),
      isActive: values.isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pkg-title" className="text-sm font-medium text-[#1A1A18]">Package Title</label>
          <input
            id="pkg-title"
            value={values.title}
            onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
            className="h-11 w-full rounded-xl border border-[#E8E6E1] px-4 text-sm text-[#1A1A18] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10"
            placeholder="e.g. Complete Kitchen Package"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="pkg-category" className="text-sm font-medium text-[#1A1A18]">Category</label>
          <select
            id="pkg-category"
            value={values.category}
            onChange={(e) => setValues((prev) => ({ ...prev, category: e.target.value as ProductCategory }))}
            className="h-11 w-full rounded-xl border border-[#E8E6E1] px-4 text-sm text-[#1A1A18] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10"
            disabled={isSaving}
          >
            <option value="kitchen">Kitchen</option>
            <option value="bedroom">Bedroom</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="pkg-price" className="text-sm font-medium text-[#1A1A18]">Package Price</label>
          <input
            id="pkg-price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => setValues((prev) => ({ ...prev, price: e.target.value }))}
            className="h-11 w-full rounded-xl border border-[#E8E6E1] px-4 text-sm text-[#1A1A18] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10"
            placeholder="9999"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pkg-image" className="text-sm font-medium text-[#1A1A18]">Image URL</label>
          <input
            id="pkg-image"
            value={values.image}
            onChange={(e) => setValues((prev) => ({ ...prev, image: e.target.value }))}
            className="h-11 w-full rounded-xl border border-[#E8E6E1] px-4 text-sm text-[#1A1A18] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10"
            placeholder="https://..."
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pkg-description" className="text-sm font-medium text-[#1A1A18]">Description</label>
          <textarea
            id="pkg-description"
            rows={4}
            value={values.description}
            onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-xl border border-[#E8E6E1] px-4 py-3 text-sm text-[#1A1A18] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10"
            placeholder="Describe what is included in this package"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pkg-features" className="text-sm font-medium text-[#1A1A18]">Features</label>
          <textarea
            id="pkg-features"
            rows={4}
            value={values.featuresText}
            onChange={(e) => setValues((prev) => ({ ...prev, featuresText: e.target.value }))}
            className="w-full rounded-xl border border-[#E8E6E1] px-4 py-3 text-sm text-[#1A1A18] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10"
            placeholder={"Cabinets\nCountertops\nAppliances"}
            disabled={isSaving}
          />
          {featurePreview.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {featurePreview.map((feature) => (
                <span key={feature} className="rounded-full bg-[#F7F5F0] px-3 py-1 text-xs font-medium text-[#6B6B68]">
                  {feature}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-[#E8E6E1] bg-[#FCFBF9] px-4 py-3 text-sm text-[#1A1A18]">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => setValues((prev) => ({ ...prev, isActive: e.target.checked }))}
          disabled={isSaving}
        />
        Package is active and available for product assignment
      </label>

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1A1A18] px-5 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#2E2E2A] disabled:opacity-60"
      >
        {isSaving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}