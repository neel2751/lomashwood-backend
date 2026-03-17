"use client";

import { useMemo, useState } from "react";

import { Loader2, Upload } from "lucide-react";

import type { CreateBrochurePayload } from "@/types/content.types";

type BrochureFormProps = {
  initialData?: Partial<CreateBrochurePayload>;
  onSave: (payload: CreateBrochurePayload) => Promise<void> | void;
  isEdit?: boolean;
  isSubmitting?: boolean;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BrochureForm({
  initialData,
  onSave,
  isEdit = false,
  isSubmitting = false,
}: BrochureFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [pdfUrl, setPdfUrl] = useState(initialData?.pdfUrl ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [pages, setPages] = useState(initialData?.pages ? String(initialData.pages) : "");
  const [sizeMb, setSizeMb] = useState(initialData?.sizeMb ? String(initialData.sizeMb) : "");
  const [year, setYear] = useState(initialData?.year ? String(initialData.year) : "");
  const [sortOrder, setSortOrder] = useState(
    initialData?.sortOrder !== undefined ? String(initialData.sortOrder) : "0",
  );
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const parsedTags = useMemo(
    () =>
      tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [tags],
  );

  const normalizedCoverImage = coverImage.trim();
  const normalizedPdfUrl = pdfUrl.trim();
  const pdfFileName = useMemo(() => {
    if (!normalizedPdfUrl) return "";

    try {
      const parsedUrl = new URL(normalizedPdfUrl);
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      return decodeURIComponent(segments[segments.length - 1] || "brochure.pdf");
    } catch {
      const segments = normalizedPdfUrl.split("/").filter(Boolean);
      return segments[segments.length - 1] || "brochure.pdf";
    }
  }, [normalizedPdfUrl]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!isEdit && !slug.trim()) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (!slug.trim()) {
      setFormError("Slug is required.");
      return;
    }

    if (!pdfUrl.trim()) {
      setFormError("PDF URL is required.");
      return;
    }

    const payload: CreateBrochurePayload = {
      title: title.trim(),
      slug: slugify(slug),
      description: description.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      pdfUrl: pdfUrl.trim(),
      category: category.trim() || undefined,
      tags: parsedTags,
      pages: pages.trim() ? Number(pages) : undefined,
      sizeMb: sizeMb.trim() ? Number(sizeMb) : undefined,
      year: year.trim() ? Number(year) : undefined,
      sortOrder: sortOrder.trim() ? Number(sortOrder) : 0,
      isFeatured,
      isPublished,
    };

    await onSave(payload);
  }

  async function uploadAsset(file: File, folder: string, source: string): Promise<string> {
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        folder,
        source,
      }),
    });

    if (!presignResponse.ok) {
      const message = await presignResponse.text();
      throw new Error(message || "Failed to prepare upload");
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
      throw new Error("Failed to upload file to storage");
    }

    return fileUrl;
  }

  async function handleCoverUpload(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Cover image must be an image file.");
      return;
    }

    try {
      setFormError(null);
      setUploadingCover(true);
      const fileUrl = await uploadAsset(file, "brochures/covers", "brochure-cover-upload");
      setCoverImage(fileUrl);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Cover image upload failed.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handlePdfUpload(file?: File) {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFormError("Please upload a PDF file.");
      return;
    }

    try {
      setFormError(null);
      setUploadingPdf(true);
      const fileUrl = await uploadAsset(file, "brochures/pdfs", "brochure-pdf-upload");
      setPdfUrl(fileUrl);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "PDF upload failed.");
    } finally {
      setUploadingPdf(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[16px] border border-[#E8E6E1] bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Title *
          <input
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="Kitchen Collection 2026"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Slug *
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="kitchen-collection-2026"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18] md:col-span-2">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="rounded-[10px] border border-[#E8E6E1] px-3 py-2 text-[13px]"
            placeholder="Short brochure summary"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Cover image URL
          <div className="space-y-2">
            <input
              value={coverImage}
              onChange={(event) => setCoverImage(event.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
              placeholder="https://..."
            />
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border border-[#E8E6E1] px-3 text-[12px] text-[#1A1A18]">
              {uploadingCover ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {uploadingCover ? "Uploading image..." : "Upload cover image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingCover || isSubmitting}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void handleCoverUpload(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            {normalizedCoverImage && (
              <div className="rounded-[10px] border border-[#E8E6E1] bg-[#FAF8F4] p-2">
                <img
                  src={normalizedCoverImage}
                  alt="Brochure cover preview"
                  className="h-36 w-full rounded-[8px] object-cover"
                />
              </div>
            )}
          </div>
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          PDF URL *
          <div className="space-y-2">
            <input
              value={pdfUrl}
              onChange={(event) => setPdfUrl(event.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
              placeholder="https://..."
            />
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border border-[#E8E6E1] px-3 text-[12px] text-[#1A1A18]">
              {uploadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadingPdf ? "Uploading PDF..." : "Upload PDF"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={uploadingPdf || isSubmitting}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void handlePdfUpload(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            {normalizedPdfUrl && (
              <div className="flex items-center justify-between rounded-[10px] border border-[#E8E6E1] bg-[#FAF8F4] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#1A1A18]">{pdfFileName}</p>
                  <p className="text-[11px] text-[#6B665C]">PDF ready</p>
                </div>
                <a
                  href={normalizedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-medium text-[#1A1A18] underline"
                >
                  Open
                </a>
              </div>
            )}
          </div>
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Category
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="kitchen"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Tags (comma separated)
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="kitchen, modern"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Pages
          <input
            value={pages}
            onChange={(event) => setPages(event.target.value)}
            type="number"
            min={1}
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="64"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Size (MB)
          <input
            value={sizeMb}
            onChange={(event) => setSizeMb(event.target.value)}
            type="number"
            min={0}
            step="0.1"
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="18.4"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Year
          <input
            value={year}
            onChange={(event) => setYear(event.target.value)}
            type="number"
            min={2000}
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="2026"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Sort order
          <input
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            type="number"
            className="h-10 rounded-[10px] border border-[#E8E6E1] px-3 text-[13px]"
            placeholder="0"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-[13px] text-[#1A1A18]">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            className="h-4 w-4 rounded border-[#CFCAC0]"
          />
          Featured brochure
        </label>

        <label className="inline-flex items-center gap-2 text-[13px] text-[#1A1A18]">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="h-4 w-4 rounded border-[#CFCAC0]"
          />
          Published
        </label>
      </div>

      {formError && (
        <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
          {formError}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center rounded-[10px] bg-[#1A1A18] px-5 text-[13px] font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Update brochure" : "Create brochure"}
        </button>
      </div>
    </form>
  );
}
