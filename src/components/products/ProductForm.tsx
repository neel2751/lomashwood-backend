"use client";

import { useState } from "react";
import { Save, Loader2, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImageUpload } from "./ProductImageUpload";

type Category = "Kitchen" | "Bedroom";
type ProductStatus = "active" | "draft" | "archived";

interface ColourOption { id: string; name: string; hex: string; }
interface SizeUnit { id: string; image: string; title: string; description: string; }

// Mock data – replace with hook data
const COLOUR_OPTIONS: ColourOption[] = [
  { id: "c1", name: "Pure White",    hex: "#FFFFFF" },
  { id: "c2", name: "Warm Linen",    hex: "#F5F0EB" },
  { id: "c3", name: "Natural Oak",   hex: "#C8924A" },
  { id: "c4", name: "Slate Grey",    hex: "#6B7280" },
  { id: "c5", name: "Midnight Blue", hex: "#1E3A5F" },
  { id: "c6", name: "Sage Green",    hex: "#7A9A6B" },
  { id: "c7", name: "Charcoal",      hex: "#374151" },
  { id: "c8", name: "Blush Pink",    hex: "#E8B4A8" },
];

const RANGE_OPTIONS = ["Luna", "Halo", "Slate", "Nordic", "Classic", "Ash", "Shaker", "Heritage"];

interface ProductFormProps {
  initialData?: Partial<{
    title: string;
    description: string;
    category: Category;
    range: string;
    price: number;
    status: ProductStatus;
    colourIds: string[];
    sizes: SizeUnit[];
  }>;
  onSave?: (data: any) => void;
  isEdit?: boolean;
}

function uid() { return Math.random().toString(36).slice(2, 8); }

export function ProductForm({ initialData, onSave, isEdit = false }: ProductFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState<Category>(initialData?.category ?? "Kitchen");
  const [range, setRange] = useState(initialData?.range ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [status, setStatus] = useState<ProductStatus>(initialData?.status ?? "draft");
  const [selectedColours, setSelectedColours] = useState<string[]>(initialData?.colourIds ?? []);
  const [sizes, setSizes] = useState<SizeUnit[]>(initialData?.sizes ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleColour = (id: string) =>
    setSelectedColours((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const addSize = () =>
    setSizes((prev) => [...prev, { id: uid(), image: "", title: "", description: "" }]);

  const updateSize = (id: string, field: keyof SizeUnit, value: string) =>
    setSizes((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const removeSize = (id: string) =>
    setSizes((prev) => prev.filter((s) => s.id !== id));

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    onSave?.({ title, description, category, range, price, status, selectedColours, sizes });
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
        {label}{required && <span className="text-[#C8924A] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";
  const selectCls = "appearance-none " + inputCls + " pr-8";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Product" : "New Product"}
          </h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">
            {isEdit ? "Update product details" : "Fill in the details to create a new product"}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !title}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#2E231A]">
        {/* Main fields */}
        <div className="lg:col-span-2 p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Product Title" required>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luna White" className={inputCls} />
            </Field>

            <Field label="Range">
              <div className="relative">
                <select value={range} onChange={(e) => setRange(e.target.value)} className={selectCls}>
                  <option value="">Select range…</option>
                  {RANGE_OPTIONS.map((r) => <option key={r} value={r} className="bg-[#1C1611]">{r}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
              </div>
            </Field>
          </div>

          <Field label="Description" required>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the product — materials, finish, style…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none"
            />
          </Field>

          {/* Images */}
          <Field label="Product Images">
            <ProductImageUpload />
          </Field>

          {/* Sizes / Units */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E]">
                Sizes & Units
              </label>
              <button
                onClick={addSize}
                className="flex items-center gap-1 text-[11px] text-[#7A6045] hover:text-[#C8924A] transition-colors"
              >
                <Plus size={12} /> Add Size
              </button>
            </div>

            {sizes.length === 0 && (
              <p className="text-[12px] text-[#3D2E1E] italic">No sizes added yet.</p>
            )}

            <div className="flex flex-col gap-3">
              {sizes.map((size) => (
                <div key={size.id} className="relative p-4 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
                  <button
                    onClick={() => removeSize(size.id)}
                    className="absolute top-3 right-3 text-[#3D2E1E] hover:text-red-400 transition-colors"
                  >
                    <X size={13} />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wide text-[#3D2E1E] mb-1">Title</label>
                      <input
                        value={size.title}
                        onChange={(e) => updateSize(size.id, "title", e.target.value)}
                        placeholder="e.g. Standard, Large…"
                        className="w-full h-9 px-3 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wide text-[#3D2E1E] mb-1">Image URL</label>
                      <input
                        value={size.image}
                        onChange={(e) => updateSize(size.id, "image", e.target.value)}
                        placeholder="https://…"
                        className="w-full h-9 px-3 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-wide text-[#3D2E1E] mb-1">Description</label>
                      <input
                        value={size.description}
                        onChange={(e) => updateSize(size.id, "description", e.target.value)}
                        placeholder="Brief size description…"
                        className="w-full h-9 px-3 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar fields */}
        <div className="p-6 flex flex-col gap-5">
          {/* Status */}
          <Field label="Status">
            <div className="relative">
              <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className={selectCls}>
                <option value="draft" className="bg-[#1C1611]">Draft</option>
                <option value="active" className="bg-[#1C1611]">Active</option>
                <option value="archived" className="bg-[#1C1611]">Archived</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>
          </Field>

          {/* Category */}
          <Field label="Category" required>
            <div className="flex gap-2">
              {(["Kitchen", "Bedroom"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex-1 h-10 rounded-[9px] text-[13px] font-medium border transition-all",
                    category === cat
                      ? "bg-[#C8924A]/15 border-[#C8924A]/50 text-[#C8924A]"
                      : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Field>

          {/* Price */}
          <Field label="Estimated Price">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232] text-[13px]">£</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
              />
            </div>
          </Field>

          {/* Colours */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Colours ({selectedColours.length} selected)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOUR_OPTIONS.map((col) => {
                const isSelected = selectedColours.includes(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleColour(col.id)}
                    title={col.name}
                    className={cn(
                      "flex flex-col items-center gap-1 p-1.5 rounded-[8px] border transition-all",
                      isSelected
                        ? "border-[#C8924A]/60 bg-[#C8924A]/10"
                        : "border-[#3D2E1E] bg-[#2E231A] hover:border-[#C8924A]/30"
                    )}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/20"
                      style={{ background: col.hex }}
                    />
                    <span className="text-[8.5px] text-[#5A4232] leading-tight text-center truncate w-full">
                      {col.name.split(" ")[0]}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8924A]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}