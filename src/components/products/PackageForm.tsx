"use client";

import { useMemo, useRef, useState } from "react";

import Image from "next/image";

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

export function PackageForm({
  initialValues,
  isSaving = false,
  submitLabel,
  onSubmit,
}: PackageFormProps) {
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const controlClass =
    "w-full rounded-xl border border-[#E8E6E1] bg-white px-4 text-sm text-[#1A1A18] placeholder:text-[#8B8A86] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10";

  const featurePreview = useMemo(
    () => normalizeFeatures(values.featuresText),
    [values.featuresText],
  );

  async function handleImageUpload(file?: File) {
    if (!file || isUploadingImage || isSaving) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be 10MB or smaller.");
      return;
    }

    try {
      setUploadError(null);
      setIsUploadingImage(true);

      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          folder: "packages",
          source: "package-form",
        }),
      });

      if (!presignResponse.ok) {
        const message = await presignResponse.text();
        throw new Error(message || "Failed to prepare image upload");
      }

      const { uploadUrl, fileUrl } = (await presignResponse.json()) as {
        uploadUrl: string;
        fileUrl: string;
      };

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setValues((prev) => ({ ...prev, image: fileUrl }));
    } catch (uploadErr) {
      setUploadError(uploadErr instanceof Error ? uploadErr.message : "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  }

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
    <form
      onSubmit={handleSubmit}
      className="space-y-7 rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm md:p-7"
    >
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {uploadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadError}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pkg-title" className="text-sm font-medium text-[#1A1A18]">
            Package Title
          </label>
          <input
            id="pkg-title"
            value={values.title}
            onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="e.g. Complete Kitchen Package"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="pkg-category" className="text-sm font-medium text-[#1A1A18]">
            Category
          </label>
          <select
            id="pkg-category"
            value={values.category}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, category: e.target.value as ProductCategory }))
            }
            className={`h-11 ${controlClass}`}
            disabled={isSaving}
          >
            <option value="kitchen">Kitchen</option>
            <option value="bedroom">Bedroom</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="pkg-price" className="text-sm font-medium text-[#1A1A18]">
            Package Price
          </label>
          <input
            id="pkg-price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => setValues((prev) => ({ ...prev, price: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="9999"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <label htmlFor="pkg-image" className="text-sm font-medium text-[#1A1A18]">
            Package Image
          </label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => imageFileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                imageFileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isSaving && !isUploadingImage) {
                setIsImageDragging(true);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsImageDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsImageDragging(false);
              if (isSaving || isUploadingImage) {
                return;
              }
              void handleImageUpload(e.dataTransfer.files?.[0]);
            }}
            className={`flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition ${
              isImageDragging
                ? "border-[#8B6914] bg-[#F7F5F0]"
                : "border-[#E8E6E1] bg-[#FCFBF9] hover:border-[#DCCCA8]"
            }`}
            aria-label="Upload package image"
          >
            <p className="text-sm font-medium text-[#1A1A18]">
              {isUploadingImage ? "Uploading image..." : "Drag & drop image here"}
            </p>
            <p className="mt-1 text-xs text-[#6B6B68]">or click to choose a file (max 10MB)</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              id="pkg-image"
              value={values.image}
              onChange={(e) => setValues((prev) => ({ ...prev, image: e.target.value }))}
              className={`h-11 ${controlClass}`}
              placeholder="Paste image URL or upload your own"
              disabled={isSaving || isUploadingImage}
            />
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handleImageUpload(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              disabled={isSaving || isUploadingImage}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E8E6E1] bg-[#FCFBF9] px-4 text-sm font-medium text-[#1A1A18] transition hover:bg-[#F7F5F0] disabled:opacity-60"
            >
              {isUploadingImage ? "Uploading..." : "Upload Image"}
            </button>
          </div>

          {values.image ? (
            <div className="overflow-hidden rounded-xl border border-[#E8E6E1] bg-[#FCFBF9]">
              <div className="relative h-44 w-full bg-[#F7F5F0]">
                <Image
                  src={values.image}
                  alt="Package preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <p className="truncate text-xs text-[#6B6B68]">{values.image}</p>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-[#1A1A18] underline underline-offset-2"
                  onClick={() => setValues((prev) => ({ ...prev, image: "" }))}
                  disabled={isSaving || isUploadingImage}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pkg-description" className="text-sm font-medium text-[#1A1A18]">
            Description
          </label>
          <textarea
            id="pkg-description"
            rows={4}
            value={values.description}
            onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
            className={`py-3 ${controlClass}`}
            placeholder="Describe what is included in this package"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pkg-features" className="text-sm font-medium text-[#1A1A18]">
            Features
          </label>
          <textarea
            id="pkg-features"
            rows={4}
            value={values.featuresText}
            onChange={(e) => setValues((prev) => ({ ...prev, featuresText: e.target.value }))}
            className={`py-3 ${controlClass}`}
            placeholder={"Cabinets\nCountertops\nAppliances"}
            disabled={isSaving}
          />
          {featurePreview.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {featurePreview.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-[#F7F5F0] px-3 py-1 text-xs font-medium text-[#6B6B68]"
                >
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || isUploadingImage}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1A1A18] px-5 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#2E2E2A] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
