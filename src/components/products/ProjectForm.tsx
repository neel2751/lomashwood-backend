"use client";

import { useRef, useState } from "react";

import Image from "next/image";

import { slugify } from "@/lib/utils";

import type { CreateProjectPayload, ProjectCategory } from "@/types/product.types";

type ProjectFormValues = {
  title: string;
  slug: string;
  category: ProjectCategory;
  location: string;
  completedAt: string;
  description: string;
  images: string[];
  style: string;
  finish: string;
  layout: string;
  duration: string;
  detailsText: string;
  isPublished: boolean;
};

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormValues>;
  isSaving?: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateProjectPayload) => Promise<void> | void;
}

function textToDetails(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawLabel, ...rest] = line.split(":");
      const label = rawLabel?.trim();
      const value = rest.join(":").trim();
      return label && value ? { label, value } : null;
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));
}

export function ProjectForm({
  initialValues,
  isSaving = false,
  submitLabel,
  onSubmit,
}: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>({
    title: initialValues?.title ?? "",
    slug: initialValues?.slug ?? "",
    category: initialValues?.category ?? "kitchen",
    location: initialValues?.location ?? "",
    completedAt: initialValues?.completedAt ?? "",
    description: initialValues?.description ?? "",
    images: initialValues?.images ?? [],
    style: initialValues?.style ?? "",
    finish: initialValues?.finish ?? "",
    layout: initialValues?.layout ?? "",
    duration: initialValues?.duration ?? "",
    detailsText: initialValues?.detailsText ?? "",
    isPublished: initialValues?.isPublished ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const controlClass =
    "w-full rounded-xl border border-[#E8E6E1] bg-white px-4 text-sm text-[#1A1A18] placeholder:text-[#8B8A86] outline-none transition focus:border-[#8B6914] focus:ring-4 focus:ring-[#8B6914]/10";

  async function uploadImage(file: File) {
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        folder: "projects",
        source: "project-form",
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

    return fileUrl;
  }

  async function handleFilesUpload(files?: FileList | null) {
    if (!files || files.length === 0 || isSaving || isUploading) {
      return;
    }

    const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (validFiles.length === 0) {
      setUploadError("Please select image files only.");
      return;
    }

    try {
      setUploadError(null);
      setIsUploading(true);

      const urls: string[] = [];
      for (const file of validFiles) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Each image must be 10MB or smaller.");
        }

        const url = await uploadImage(file);
        urls.push(url);
      }

      setValues((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
      }));
    } catch (uploadErr) {
      setUploadError(uploadErr instanceof Error ? uploadErr.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isSaving && !isUploading) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    void handleFilesUpload(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError("Project title is required.");
      return;
    }

    if (!values.location.trim()) {
      setError("Project location is required.");
      return;
    }

    const normalizedSlug = slugify(values.slug || values.title);

    if (!normalizedSlug) {
      setError("Project slug is required.");
      return;
    }

    if (!values.completedAt) {
      setError("Completed date is required.");
      return;
    }

    if (!values.description.trim()) {
      setError("Project description is required.");
      return;
    }

    await onSubmit({
      title: values.title.trim(),
      slug: normalizedSlug,
      category: values.category,
      location: values.location.trim(),
      completedAt: values.completedAt,
      description: values.description.trim(),
      images: values.images,
      style: values.style.trim() || undefined,
      finish: values.finish.trim() || undefined,
      layout: values.layout.trim() || undefined,
      duration: values.duration.trim() || undefined,
      details: textToDetails(values.detailsText),
      isPublished: values.isPublished,
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
        <div className="space-y-2">
          <label htmlFor="project-title" className="text-sm font-medium text-[#1A1A18]">
            Project Title
          </label>
          <input
            id="project-title"
            value={values.title}
            onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="Project title"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-location" className="text-sm font-medium text-[#1A1A18]">
            Location
          </label>
          <input
            id="project-location"
            value={values.location}
            onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="Location (e.g. London, UK)"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-slug" className="text-sm font-medium text-[#1A1A18]">
            Slug
          </label>
          <input
            id="project-slug"
            value={values.slug}
            onChange={(e) => setValues((prev) => ({ ...prev, slug: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="e.g. chelsea-kitchen-renovation"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-category" className="text-sm font-medium text-[#1A1A18]">
            Category
          </label>
          <select
            id="project-category"
            value={values.category}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, category: e.target.value as ProjectCategory }))
            }
            className={`h-11 ${controlClass}`}
            disabled={isSaving}
          >
            <option value="kitchen">Kitchen</option>
            <option value="bedroom">Bedroom</option>
            <option value="media_wall">Media Wall</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="project-completed-at" className="text-sm font-medium text-[#1A1A18]">
            Completed Date
          </label>
          <input
            id="project-completed-at"
            type="date"
            value={values.completedAt}
            onChange={(e) => setValues((prev) => ({ ...prev, completedAt: e.target.value }))}
            className={`h-11 ${controlClass}`}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-style" className="text-sm font-medium text-[#1A1A18]">
            Style
          </label>
          <input
            id="project-style"
            value={values.style}
            onChange={(e) => setValues((prev) => ({ ...prev, style: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="Style"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-finish" className="text-sm font-medium text-[#1A1A18]">
            Finish
          </label>
          <input
            id="project-finish"
            value={values.finish}
            onChange={(e) => setValues((prev) => ({ ...prev, finish: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="Finish"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-layout" className="text-sm font-medium text-[#1A1A18]">
            Layout
          </label>
          <input
            id="project-layout"
            value={values.layout}
            onChange={(e) => setValues((prev) => ({ ...prev, layout: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="Layout"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-duration" className="text-sm font-medium text-[#1A1A18]">
            Duration
          </label>
          <input
            id="project-duration"
            value={values.duration}
            onChange={(e) => setValues((prev) => ({ ...prev, duration: e.target.value }))}
            className={`h-11 ${controlClass}`}
            placeholder="Duration (e.g. 3 weeks)"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="project-description" className="text-sm font-medium text-[#1A1A18]">
            Description
          </label>
          <textarea
            id="project-description"
            rows={4}
            value={values.description}
            onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
            className={`py-3 ${controlClass}`}
            placeholder="Project description"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="project-details" className="text-sm font-medium text-[#1A1A18]">
            Details
          </label>
          <textarea
            id="project-details"
            rows={4}
            value={values.detailsText}
            onChange={(e) => setValues((prev) => ({ ...prev, detailsText: e.target.value }))}
            className={`py-3 ${controlClass}`}
            placeholder={"Style: Modern Handleless\nWorktop: Quartz"}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#1A1A18]">Project Images</p>
            <input
              ref={imagesInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void handleFilesUpload(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => imagesInputRef.current?.click()}
              disabled={isSaving || isUploading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E8E6E1] bg-[#FCFBF9] px-4 text-sm font-medium text-[#1A1A18] transition hover:bg-[#F7F5F0] disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Upload Images"}
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isSaving && !isUploading) {
                imagesInputRef.current?.click();
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isSaving && !isUploading) {
                e.preventDefault();
                imagesInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors ${
              isDragOver
                ? "border-[#1A1A18] bg-[#F6F4EF]"
                : "border-[#D9D5CD] bg-[#FCFBF9] hover:bg-[#F8F6F1]"
            } ${isSaving || isUploading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            aria-label="Upload project images"
          >
            <p className="text-sm font-medium text-[#1A1A18]">Drag and drop images here</p>
            <p className="mt-1 text-[12px] text-[#7A776F]">or click to browse files</p>
            <p className="mt-2 text-[11px] text-[#7A776F]">PNG, JPG, WEBP up to 10MB each</p>
          </div>

          {values.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {values.images.map((url) => (
                <div
                  key={url}
                  className="relative overflow-hidden rounded-[10px] border border-[#E8E6E1] bg-[#FCFBF9]"
                >
                  <Image
                    src={url}
                    alt="Project"
                    width={400}
                    height={160}
                    className="h-24 w-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        images: prev.images.filter((image) => image !== url),
                      }))
                    }
                    className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                    disabled={isSaving || isUploading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#DDD8CD] px-4 py-4 text-sm text-[#6B6B68]">
              No images uploaded yet.
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-[#E8E6E1] bg-[#FCFBF9] px-4 py-3 text-sm text-[#1A1A18]">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(e) => setValues((prev) => ({ ...prev, isPublished: e.target.checked }))}
          disabled={isSaving}
        />
        Project is published and visible in public API responses
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1A1A18] px-5 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#2E2E2A] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
