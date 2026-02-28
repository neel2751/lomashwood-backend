"use client";

import { useState } from "react";
import { Save, Loader2, ChevronDown, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type PriceType = "standard" | "sale" | "package";

const PRODUCT_OPTIONS = [
  { id: "1", title: "Luna White",       category: "Kitchen" },
  { id: "2", title: "Halo Oak",         category: "Bedroom" },
  { id: "3", title: "Slate Grey Gloss", category: "Kitchen" },
  { id: "4", title: "Nordic Birch",     category: "Bedroom" },
  { id: "5", title: "Pebble J-Pull",    category: "Kitchen" },
];

const SIZE_OPTIONS = ["Standard", "Large", "Compact", "Single", "Double", "Triple"];

interface PricingFormProps {
  initialData?: {
    productId?: string;
    size?: string;
    type?: PriceType;
    basePrice?: number;
    salePrice?: number;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
  };
  onSave?: (data: any) => void;
  isEdit?: boolean;
}

export function PricingForm({ initialData, onSave, isEdit = false }: PricingFormProps) {
  const [productId, setProductId] = useState(initialData?.productId ?? "");
  const [size, setSize] = useState(initialData?.size ?? "");
  const [type, setType] = useState<PriceType>(initialData?.type ?? "standard");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() ?? "");
  const [salePrice, setSalePrice] = useState(initialData?.salePrice?.toString() ?? "");
  const [validFrom, setValidFrom] = useState(initialData?.validFrom ?? "");
  const [validTo, setValidTo] = useState(initialData?.validTo ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const discount = basePrice && salePrice
    ? Math.round((1 - parseFloat(salePrice) / parseFloat(basePrice)) * 100)
    : null;

  const handleSubmit = async () => {
    if (!productId || !basePrice) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ productId, size, type, basePrice, salePrice, validFrom, validTo, isActive });
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";
  const selectCls = "appearance-none " + inputCls + " pr-8";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Pricing Rule" : "New Pricing Rule"}
          </h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Set base price, sale price, or package deal</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !productId || !basePrice}
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
        {/* Product + Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
              Product <span className="text-[#C8924A]">*</span>
            </label>
            <div className="relative">
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={selectCls}>
                <option value="">Select product…</option>
                {PRODUCT_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1C1611]">
                    {p.title} ({p.category})
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Size</label>
            <div className="relative">
              <select value={size} onChange={(e) => setSize(e.target.value)} className={selectCls}>
                <option value="">All sizes</option>
                {SIZE_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#1C1611]">{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
            Price Type
          </label>
          <div className="flex gap-2">
            {([
              { value: "standard", label: "Standard" },
              { value: "sale",     label: "Sale",    icon: Tag },
              { value: "package",  label: "Package", icon: Tag },
            ] as { value: PriceType; label: string; icon?: typeof Tag }[]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[9px] text-[12.5px] font-medium border transition-all",
                  type === value
                    ? "bg-[#C8924A]/15 border-[#C8924A]/50 text-[#C8924A]"
                    : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/30"
                )}
              >
                {Icon && <Icon size={12} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
              Base Price <span className="text-[#C8924A]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232] text-[13px]">£</span>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0" className="w-full h-10 pl-7 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
              Sale Price
              {discount !== null && discount > 0 && (
                <span className="ml-2 text-emerald-400 normal-case font-normal">({discount}% off)</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232] text-[13px]">£</span>
              <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0" disabled={type === "standard"}
                className="w-full h-10 pl-7 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors disabled:opacity-40 disabled:pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Validity dates */}
        {type !== "standard" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
                Valid From
              </label>
              <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
                Valid To
              </label>
              <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {/* Active toggle */}
        <div className="flex items-center justify-between py-3 px-4 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
          <div>
            <p className="text-[13px] font-medium text-[#C8B99A]">Active</p>
            <p className="text-[11px] text-[#3D2E1E]">Show this price on the customer-facing site</p>
          </div>
          <button
            onClick={() => setIsActive((v) => !v)}
            className={cn(
              "w-10 h-6 rounded-full border relative transition-all",
              isActive ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#2E231A] border-[#3D2E1E]"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
              isActive ? "left-[18px]" : "left-0.5"
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}