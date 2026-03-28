"use client";

import { useState } from "react";

import { Save, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type CategoryName = "Kitchen" | "Bedroom";

interface CategorySaveData {
  name: CategoryName;
  description: string;
}

interface CategoryFormProps {
  initialData?: { name?: CategoryName; description?: string };
  onSave?: (data: CategorySaveData) => void;
  isEdit?: boolean;
}

export function CategoryForm({ initialData, onSave, isEdit = false }: CategoryFormProps) {
  const [name, setName] = useState<CategoryName>(initialData?.name ?? "Kitchen");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const controlClass =
    "w-full rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 py-2.5 text-[13px] text-[#1A1A18] placeholder:text-[#8B8A86] focus:outline-none focus:border-[#C8924A]/60 transition-colors resize-none";

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ name, description });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611]">
      <div className="flex items-center justify-between border-b border-[#2E231A] px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Category" : "New Category"}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#5A4232]">Kitchen or Bedroom product grouping</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
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
        {/* Category name toggle */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
            Category <span className="text-[#C8924A]">*</span>
          </p>
          <div className="flex gap-2">
            {(["Kitchen", "Bedroom"] as CategoryName[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setName(cat)}
                className={cn(
                  "h-11 flex-1 rounded-[10px] border text-[13px] font-medium transition-all",
                  name === cat
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

        {/* Slug preview */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
            URL Slug (auto-generated)
          </p>
          <div className="flex h-10 items-center rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3">
            <span className="text-[13px] text-[#6B6B68]">/products/</span>
            <span className="font-mono text-[13px] text-[#8B6914]">{name.toLowerCase()}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="category-description"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Description
          </label>
          <textarea
            id="category-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this category…"
            className={controlClass}
          />
        </div>
      </div>
    </div>
  );
}
