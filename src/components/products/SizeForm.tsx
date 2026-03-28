"use client";

import { useState } from "react";

import Image from "next/image";

import { Save, Loader2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

interface SizeFormDefaultValues {
  name?: string;
  category?: string;
  width?: number;
  height?: number;
  depth?: number;
  description?: string;
}

interface SizeFormData {
  sizeId: string | undefined;
  title: string;
  description: string;
  imageUrl: string;
  category: "Kitchen" | "Bedroom";
  width: number | undefined;
  height: number | undefined;
  depth: number | undefined;
}

interface SizeFormProps {
  sizeId?: string;
  defaultValues?: SizeFormDefaultValues;
  initialData?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    category?: "Kitchen" | "Bedroom";
  };
  onSave?: (data: SizeFormData) => void;
  isEdit?: boolean;
}

export function SizeForm({
  sizeId,
  defaultValues,
  initialData,
  onSave,
  isEdit = false,
}: SizeFormProps) {
  const [title, setTitle] = useState(defaultValues?.name ?? initialData?.title ?? "");
  const [description, setDescription] = useState(
    defaultValues?.description ?? initialData?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [category, setCategory] = useState<"Kitchen" | "Bedroom">(
    (defaultValues?.category as "Kitchen" | "Bedroom") ?? initialData?.category ?? "Kitchen",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async () => {
    if (!title) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({
      sizeId,
      title,
      description,
      imageUrl,
      category,
      width: defaultValues?.width,
      height: defaultValues?.height,
      depth: defaultValues?.depth,
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls =
    "w-full h-10 rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[13px] text-[#1A1A18] placeholder:text-[#8B8A86] focus:outline-none focus:border-[#C8924A]/60 transition-colors";

  return (
    <div className="max-w-lg overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2E231A] px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Size" : "New Size / Unit"}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#5A4232]">
            Define a product size or configuration unit
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !title}
          className={cn(
            "flex h-9 items-center gap-2 rounded-[9px] px-4 text-[12.5px] font-medium transition-all",
            saved
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="flex flex-col gap-5 p-6">
        {/* Category — button group, not a labellable control */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
            Category <span className="text-[#C8924A]">*</span>
          </p>
          <div className="flex gap-2" role="group" aria-label="Category">
            {(["Kitchen", "Bedroom"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={cn(
                  "h-10 flex-1 rounded-[9px] border text-[13px] font-medium transition-all",
                  category === cat
                    ? cat === "Kitchen"
                      ? "border-[#C8924A]/50 bg-[#C8924A]/15 text-[#C8924A]"
                      : "border-[#6B8A9A]/50 bg-[#6B8A9A]/15 text-[#6B8A9A]"
                    : "border-[#3D2E1E] bg-[#2E231A] text-[#5A4232] hover:border-[#C8924A]/30 hover:text-[#C8924A]",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="size-title"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Title <span className="text-[#C8924A]">*</span>
          </label>
          <input
            id="size-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Standard, Large, Double…"
            className={inputCls}
          />
        </div>

        {/* Dimensions (read-only display if provided via defaultValues) */}
        {defaultValues && (
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { label: "Width (mm)", id: "size-width", value: defaultValues.width },
                { label: "Height (mm)", id: "size-height", value: defaultValues.height },
                { label: "Depth (mm)", id: "size-depth", value: defaultValues.depth },
              ] as const
            ).map(({ label, id, value }) => (
              <div key={label}>
                <label
                  htmlFor={id}
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
                >
                  {label}
                </label>
                <input id={id} type="number" defaultValue={value} className={inputCls} />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div>
          <label
            htmlFor="size-description"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Description
          </label>
          <textarea
            id="size-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the size — dimensions, typical use…"
            className="w-full resize-none rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 py-2.5 text-[13px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none"
          />
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="size-image-url"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Image URL
          </label>
          <div className="flex gap-2">
            <input
              id="size-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://cdn.lomashwood.co.uk/sizes/…"
              className={cn(inputCls, "flex-1")}
            />
            <button className="flex h-10 items-center gap-1.5 rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] px-3 text-[12px] text-[#5A4232] transition-all hover:border-[#C8924A]/40 hover:text-[#C8924A]">
              <Upload size={13} /> Upload
            </button>
          </div>

          {/* Preview */}
          {imageUrl && (
            <div className="relative mt-2 h-24 w-32 overflow-hidden rounded-[8px] border border-[#3D2E1E] bg-[#2E231A]">
              <Image src={imageUrl} alt="Size preview" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
