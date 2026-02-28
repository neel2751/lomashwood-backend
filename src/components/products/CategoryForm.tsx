"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryName = "Kitchen" | "Bedroom";

interface CategoryFormProps {
  initialData?: { name?: CategoryName; description?: string };
  onSave?: (data: any) => void;
  isEdit?: boolean;
}

export function CategoryForm({ initialData, onSave, isEdit = false }: CategoryFormProps) {
  const [name, setName] = useState<CategoryName>(initialData?.name ?? "Kitchen");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ name, description });
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Category" : "New Category"}
          </h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Kitchen or Bedroom product grouping</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
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
        {/* Category name toggle */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
            Category <span className="text-[#C8924A]">*</span>
          </label>
          <div className="flex gap-2">
            {(["Kitchen", "Bedroom"] as CategoryName[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setName(cat)}
                className={cn(
                  "flex-1 h-11 rounded-[10px] text-[13px] font-medium border transition-all",
                  name === cat
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

        {/* Slug preview */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            URL Slug (auto-generated)
          </label>
          <div className="flex items-center h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E]">
            <span className="text-[#5A4232] text-[13px]">/products/</span>
            <span className="text-[#C8924A] text-[13px] font-mono">{name.toLowerCase()}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this category…"
            className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}