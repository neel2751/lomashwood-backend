"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Upload,
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  Type,
  Sliders,
  Save,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCreateHeroSlide, useUpdateHeroSlide, type HeroSlide } from "@/hooks/useHeroSlides";
import { fetchWithAuth } from "@/lib/fetch-client";

interface HeroSlideEditorProps {
  slide?: HeroSlide | null;
  onClose: () => void;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/mov",
];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB for videos

export function HeroSlideEditor({ slide, onClose }: HeroSlideEditorProps) {
  const isEditing = !!slide;
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    type: slide?.type ?? ("image" as "image" | "video"),
    src: slide?.src ?? "",
    title: slide?.title ?? "",
    subtitle: slide?.subtitle ?? "",
    description: slide?.description ?? "",
    ctaText: slide?.ctaText ?? "",
    ctaLink: slide?.ctaLink ?? "",
    secondaryCtaText: slide?.secondaryCtaText ?? "",
    secondaryCtaLink: slide?.secondaryCtaLink ?? "",
    overlayOpacity: slide?.overlayOpacity ?? 0.4,
    isActive: slide?.isActive ?? true,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const createSlide = useCreateHeroSlide();
  const updateSlide = useUpdateHeroSlide();

  const handleFileSelect = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG, WebP) or video (MP4, MOV)");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("File size must be less than 50MB");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Get presigned URL
      const presignRes = await fetchWithAuth("/api/uploads/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "hero",
          source: "hero-section",
        }),
      });

      // Upload to S3
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", presignRes.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Update form with new URL
      const isVideo = file.type.startsWith("video");
      setForm((prev) => ({
        ...prev,
        type: isVideo ? "video" : "image",
        src: presignRes.fileUrl,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.src) {
      setError("Please upload a media file");
      return;
    }

    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      if (isEditing && slide) {
        await updateSlide.mutateAsync({ id: slide.id, payload: form });
      } else {
        await createSlide.mutateAsync({ ...form, order: 0 });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save slide");
    }
  };

  const isPending = createSlide.isPending || updateSlide.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border border-[#2E231A] bg-[#1C1611] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E231A] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#E8D5B7]">
            {isEditing ? "Edit Slide" : "New Slide"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5A4232] transition-all hover:bg-[#2E231A] hover:text-[#E8D5B7]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          {/* Media Upload */}
          <div>
            <label className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#5A4232]">
              <Upload size={12} /> Media
            </label>

            {form.src ? (
              <div className="relative overflow-hidden rounded-[12px] border border-[#3D2E1E] bg-[#2E231A]">
                <div className="relative aspect-video">
                  {form.type === "image" ? (
                    <Image src={form.src} alt="Preview" fill className="object-cover" />
                  ) : (
                    <video src={form.src} className="h-full w-full object-cover" controls />
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-black"
                    style={{ opacity: form.overlayOpacity }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, src: "" }))}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-red-500"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-3 left-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium",
                      form.type === "image"
                        ? "bg-[#C8924A]/80 text-white"
                        : "bg-purple-500/80 text-white",
                    )}
                  >
                    {form.type === "image" ? <ImageIcon size={10} /> : <Film size={10} />}
                    {form.type}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed transition-all",
                  uploading
                    ? "cursor-wait border-[#C8924A] bg-[#C8924A]/10"
                    : "cursor-pointer border-[#3D2E1E] hover:border-[#C8924A]/40 hover:bg-[#221A12]",
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 size={32} className="animate-spin text-[#C8924A]" />
                    <p className="text-[13px] text-[#E8D5B7]">Uploading... {uploadProgress}%</p>
                    <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[#2E231A]">
                      <div
                        className="h-full rounded-full bg-[#C8924A] transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2E231A]">
                      <Upload size={22} className="text-[#5A4232]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-[#E8D5B7]">
                        Drop image or video here
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#5A4232]">
                        or click to browse · JPG, PNG, WebP, MP4, MOV · Max 50MB
                      </p>
                    </div>
                  </>
                )}
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* Text Content */}
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#5A4232]">
              <Type size={12} /> Content
            </label>

            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Title *"
              className="h-11 rounded-[10px] border border-[#3D2E1E] bg-[#2E231A] px-4 text-[13px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
            />

            <input
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              placeholder="Subtitle"
              className="h-11 rounded-[10px] border border-[#3D2E1E] bg-[#2E231A] px-4 text-[13px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
            />

            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description"
              rows={2}
              className="resize-none rounded-[10px] border border-[#3D2E1E] bg-[#2E231A] px-4 py-3 text-[13px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
            />
          </div>

          {/* CTAs */}
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#5A4232]">
              <LinkIcon size={12} /> Call to Actions
            </label>

            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.ctaText}
                onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                placeholder="Primary CTA Text"
                className="h-10 rounded-[8px] border border-[#3D2E1E] bg-[#2E231A] px-3 text-[12px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
              />
              <input
                value={form.ctaLink}
                onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
                placeholder="Primary CTA Link"
                className="h-10 rounded-[8px] border border-[#3D2E1E] bg-[#2E231A] px-3 text-[12px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.secondaryCtaText}
                onChange={(e) => setForm((p) => ({ ...p, secondaryCtaText: e.target.value }))}
                placeholder="Secondary CTA Text"
                className="h-10 rounded-[8px] border border-[#3D2E1E] bg-[#2E231A] px-3 text-[12px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
              />
              <input
                value={form.secondaryCtaLink}
                onChange={(e) => setForm((p) => ({ ...p, secondaryCtaLink: e.target.value }))}
                placeholder="Secondary CTA Link"
                className="h-10 rounded-[8px] border border-[#3D2E1E] bg-[#2E231A] px-3 text-[12px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#5A4232]">
              <Sliders size={12} /> Settings
            </label>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] text-[#5A4232]">
                  Overlay Opacity: {Math.round(form.overlayOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={form.overlayOpacity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, overlayOpacity: parseFloat(e.target.value) }))
                  }
                  className="h-2 w-full appearance-none rounded-full bg-[#2E231A] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C8924A]"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="peer sr-only"
                />
                <div className="relative h-5 w-9 rounded-full border border-[#3D2E1E] bg-[#2E231A] transition-all peer-checked:border-emerald-500/50 peer-checked:bg-emerald-500/20">
                  <div
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full transition-all",
                      form.isActive
                        ? "left-[calc(100%-18px)] bg-emerald-400"
                        : "left-0.5 bg-[#5A4232]",
                    )}
                  />
                </div>
                <span className="text-[12px] text-[#5A4232]">Active</span>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-[10px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-[12px] text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[9px] px-5 text-[13px] font-medium text-[#5A4232] transition-colors hover:bg-[#2E231A] hover:text-[#E8D5B7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || uploading}
              className="flex h-10 items-center gap-2 rounded-[9px] bg-[#C8924A] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#B87E3E] disabled:pointer-events-none disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isEditing ? "Update Slide" : "Create Slide"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
