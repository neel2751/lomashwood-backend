"use client";

import { useState } from "react";

import { Save, Loader2, ChevronDown, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { ProductImageUpload } from "./ProductImageUpload";

type Category = "Kitchen" | "Bedroom";
type ProductStatus = "active" | "draft" | "archived";

interface ColourOption {
  id: string;
  name: string;
  hex: string;
}
interface SizeUnit {
  id: string;
  image: string;
  title: string;
  description: string;
}

const COLOUR_OPTIONS: ColourOption[] = [
  { id: "c1", name: "Pure White", hex: "#FFFFFF" },
  { id: "c2", name: "Warm Linen", hex: "#F5F0EB" },
  { id: "c3", name: "Natural Oak", hex: "#C8924A" },
  { id: "c4", name: "Slate Grey", hex: "#6B7280" },
  { id: "c5", name: "Midnight Blue", hex: "#1E3A5F" },
  { id: "c6", name: "Sage Green", hex: "#7A9A6B" },
  { id: "c7", name: "Charcoal", hex: "#374151" },
  { id: "c8", name: "Blush Pink", hex: "#E8B4A8" },
];

const RANGE_OPTIONS = ["Luna", "Halo", "Slate", "Nordic", "Classic", "Ash", "Shaker", "Heritage"];

interface ProductFormData {
  title: string;
  description: string;
  category: Category;
  range: string;
  price: string;
  status: ProductStatus;
  selectedColours: string[];
  sizes: SizeUnit[];
}

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
  onSave?: (data: ProductFormData) => void;
  isEdit?: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

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
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const addSize = () =>
    setSizes((prev) => [...prev, { id: uid(), image: "", title: "", description: "" }]);

  const updateSize = (id: string, field: keyof SizeUnit, value: string) =>
    setSizes((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const removeSize = (id: string) => setSizes((prev) => prev.filter((s) => s.id !== id));

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    onSave?.({ title, description, category, range, price, status, selectedColours, sizes });
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({
    label,
    htmlFor,
    required,
    children,
  }: {
    label: string;
    htmlFor: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
      >
        {label}
        {required && <span className="ml-0.5 text-[#C8924A]">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls =
    "w-full h-10 rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[13px] text-[#1A1A18] placeholder:text-[#8B8A86] focus:outline-none focus:border-[#C8924A]/60 transition-colors";
  const selectCls = "appearance-none " + inputCls + " pr-8";

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2E231A] px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Product" : "New Product"}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#5A4232]">
            {isEdit ? "Update product details" : "Fill in the details to create a new product"}
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

      <div className="grid grid-cols-1 gap-0 divide-y divide-[#2E231A] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Main fields */}
        <div className="flex flex-col gap-5 p-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Product Title" htmlFor="product-title" required>
              <input
                id="product-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luna White"
                className={inputCls}
              />
            </Field>

            <Field label="Range" htmlFor="product-range">
              <div className="relative">
                <select
                  id="product-range"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select range…</option>
                  {RANGE_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-[#FCFBF9] text-[#1A1A18]">
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232]"
                />
              </div>
            </Field>
          </div>

          <Field label="Description" htmlFor="product-description" required>
            <textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the product — materials, finish, style…"
              className="w-full resize-none rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 py-2.5 text-[13px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none"
            />
          </Field>

          {/* Images — no associated control; use a plain heading */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
              Product Images
            </p>
            <ProductImageUpload />
          </div>

          {/* Sizes / Units */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
                Sizes &amp; Units
              </p>
              <button
                onClick={addSize}
                className="flex items-center gap-1 text-[11px] text-[#7A6045] transition-colors hover:text-[#C8924A]"
              >
                <Plus size={12} /> Add Size
              </button>
            </div>

            {sizes.length === 0 && (
              <p className="text-[12px] italic text-[#3D2E1E]">No sizes added yet.</p>
            )}

            <div className="flex flex-col gap-3">
              {sizes.map((size) => (
                <div
                  key={size.id}
                  className="relative rounded-[10px] border border-[#3D2E1E] bg-[#2E231A] p-4"
                >
                  <button
                    onClick={() => removeSize(size.id)}
                    className="absolute right-3 top-3 text-[#3D2E1E] transition-colors hover:text-red-400"
                  >
                    <X size={13} />
                  </button>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`size-title-${size.id}`}
                        className="mb-1 block text-[10px] uppercase tracking-wide text-[#8F7B65]"
                      >
                        Title
                      </label>
                      <input
                        id={`size-title-${size.id}`}
                        value={size.title}
                        onChange={(e) => updateSize(size.id, "title", e.target.value)}
                        placeholder="e.g. Standard, Large…"
                        className="h-9 w-full rounded-[8px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[12.5px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`size-image-${size.id}`}
                        className="mb-1 block text-[10px] uppercase tracking-wide text-[#8F7B65]"
                      >
                        Image URL
                      </label>
                      <input
                        id={`size-image-${size.id}`}
                        value={size.image}
                        onChange={(e) => updateSize(size.id, "image", e.target.value)}
                        placeholder="https://…"
                        className="h-9 w-full rounded-[8px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[12.5px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`size-description-${size.id}`}
                        className="mb-1 block text-[10px] uppercase tracking-wide text-[#8F7B65]"
                      >
                        Description
                      </label>
                      <input
                        id={`size-description-${size.id}`}
                        value={size.description}
                        onChange={(e) => updateSize(size.id, "description", e.target.value)}
                        placeholder="Brief size description…"
                        className="h-9 w-full rounded-[8px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[12.5px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar fields */}
        <div className="flex flex-col gap-5 p-6">
          <Field label="Status" htmlFor="product-status">
            <div className="relative">
              <select
                id="product-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className={selectCls}
              >
                <option value="draft" className="bg-[#FCFBF9] text-[#1A1A18]">
                  Draft
                </option>
                <option value="active" className="bg-[#FCFBF9] text-[#1A1A18]">
                  Active
                </option>
                <option value="archived" className="bg-[#FCFBF9] text-[#1A1A18]">
                  Archived
                </option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232]"
              />
            </div>
          </Field>

          {/* Category — button group, not a labellable control */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
              Category <span className="text-[#C8924A]">*</span>
            </p>
            <div className="flex gap-2" role="group" aria-label="Category">
              {(["Kitchen", "Bedroom"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                  className={cn(
                    "h-10 flex-1 rounded-[9px] border text-[13px] font-medium transition-all",
                    category === cat
                      ? "border-[#C8924A]/50 bg-[#C8924A]/15 text-[#C8924A]"
                      : "border-[#3D2E1E] bg-[#2E231A] text-[#5A4232] hover:border-[#C8924A]/30 hover:text-[#C8924A]",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Field label="Estimated Price" htmlFor="product-price">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#5A4232]">
                £
              </span>
              <input
                id="product-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] pl-7 pr-3 text-[13px] text-[#E8D5B7] transition-colors placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none"
              />
            </div>
          </Field>

          {/* Colours — swatch grid, not a labellable control */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3D2E1E]">
              Colours ({selectedColours.length} selected)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {COLOUR_OPTIONS.map((col) => {
                const isSelected = selectedColours.includes(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleColour(col.id)}
                    title={col.name}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-[8px] border p-1.5 transition-all",
                      isSelected
                        ? "border-[#C8924A]/60 bg-[#C8924A]/10"
                        : "border-[#3D2E1E] bg-[#2E231A] hover:border-[#C8924A]/30",
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-black/20"
                      style={{ background: col.hex }}
                    />
                    <span className="w-full truncate text-center text-[8.5px] leading-tight text-[#5A4232]">
                      {col.name.split(" ")[0]}
                    </span>
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#C8924A]" />}
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
