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
  initialData?: { title?: string; description?: string; imageUrl?: string; category?: "Kitchen" | "Bedroom" };
  onSave?: (data: SizeFormData) => void;
  isEdit?: boolean;
}

export function SizeForm({ sizeId, defaultValues, initialData, onSave, isEdit = false }: SizeFormProps) {
  const [title, setTitle] = useState(defaultValues?.name ?? initialData?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? initialData?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [category, setCategory] = useState<"Kitchen" | "Bedroom">(
    (defaultValues?.category as "Kitchen" | "Bedroom") ?? initialData?.category ?? "Kitchen"
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

  const inputCls = "w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">{isEdit ? "Edit Size" : "New Size / Unit"}</h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Define a product size or configuration unit</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !title}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Category — button group, not a labellable control */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
            Category <span className="text-[#C8924A]">*</span>
          </p>
          <div className="flex gap-2" role="group" aria-label="Category">
            {(["Kitchen", "Bedroom"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={cn(
                  "flex-1 h-10 rounded-[9px] text-[13px] font-medium border transition-all",
                  category === cat
                    ? cat === "Kitchen"
                      ? "bg-[#C8924A]/15 border-[#C8924A]/50 text-[#C8924A]"
                      : "bg-[#6B8A9A]/15 border-[#6B8A9A]/50 text-[#6B8A9A]"
                    : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:border-[#C8924A]/30 hover:text-[#C8924A]"
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
            className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5"
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
            {([
              { label: "Width (mm)",  id: "size-width",  value: defaultValues.width  },
              { label: "Height (mm)", id: "size-height", value: defaultValues.height },
              { label: "Depth (mm)",  id: "size-depth",  value: defaultValues.depth  },
            ] as const).map(({ label, id, value }) => (
              <div key={label}>
                <label
                  htmlFor={id}
                  className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5"
                >
                  {label}
                </label>
                <input
                  id={id}
                  type="number"
                  defaultValue={value}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div>
          <label
            htmlFor="size-description"
            className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5"
          >
            Description
          </label>
          <textarea
            id="size-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the size — dimensions, typical use…"
            className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none"
          />
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="size-image-url"
            className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5"
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
            <button className="h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/40 transition-all flex items-center gap-1.5 text-[12px]">
              <Upload size={13} /> Upload
            </button>
          </div>

          {/* Preview */}
          {imageUrl && (
            <div className="mt-2 h-24 w-32 rounded-[8px] border border-[#3D2E1E] overflow-hidden bg-[#2E231A] relative">
              <Image
                src={imageUrl}
                alt="Size preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}