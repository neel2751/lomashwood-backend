"use client";

import { useState } from "react";

import { Save, Loader2, ChevronDown, Tag } from "lucide-react";

import { cn } from "@/lib/utils";

type PriceType = "standard" | "sale" | "package";

const PRODUCT_OPTIONS = [
  { id: "1", title: "Luna White", category: "Kitchen" },
  { id: "2", title: "Halo Oak", category: "Bedroom" },
  { id: "3", title: "Slate Grey Gloss", category: "Kitchen" },
  { id: "4", title: "Nordic Birch", category: "Bedroom" },
  { id: "5", title: "Pebble J-Pull", category: "Kitchen" },
];

const SIZE_OPTIONS = ["Standard", "Large", "Compact", "Single", "Double", "Triple"];

interface PricingFormData {
  productId: string;
  size: string;
  type: PriceType;
  basePrice: string;
  salePrice: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

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
  onSave?: (data: PricingFormData) => void;
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

  const discount =
    basePrice && salePrice
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

  const inputCls =
    "w-full h-10 rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[13px] text-[#1A1A18] placeholder:text-[#8B8A86] focus:outline-none focus:border-[#C8924A]/60 transition-colors";
  const selectCls = "appearance-none " + inputCls + " pr-8";

  return (
    <div className="max-w-xl overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2E231A] px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Pricing Rule" : "New Pricing Rule"}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#5A4232]">
            Set base price, sale price, or package deal
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !productId || !basePrice}
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
        {/* Product + Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="pricing-product"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
            >
              Product <span className="text-[#C8924A]">*</span>
            </label>
            <div className="relative">
              <select
                id="pricing-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={selectCls}
              >
                <option value="">Select product…</option>
                {PRODUCT_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#FCFBF9] text-[#1A1A18]">
                    {p.title} ({p.category})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232]"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="pricing-size"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
            >
              Size
            </label>
            <div className="relative">
              <select
                id="pricing-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className={selectCls}
              >
                <option value="">All sizes</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#FCFBF9] text-[#1A1A18]">
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232]"
              />
            </div>
          </div>
        </div>

        {/* Type */}
        <div>
          <p className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
            Price Type
          </p>
          <div className="flex gap-2" role="group" aria-label="Price Type">
            {(
              [
                { value: "standard", label: "Standard" },
                { value: "sale", label: "Sale", icon: Tag },
                { value: "package", label: "Package", icon: Tag },
              ] as { value: PriceType; label: string; icon?: typeof Tag }[]
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={cn(
                  "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[9px] border text-[12.5px] font-medium transition-all",
                  type === value
                    ? "border-[#C8924A]/50 bg-[#C8924A]/15 text-[#C8924A]"
                    : "border-[#3D2E1E] bg-[#2E231A] text-[#5A4232] hover:border-[#C8924A]/30 hover:text-[#C8924A]",
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
            <label
              htmlFor="pricing-base-price"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
            >
              Base Price <span className="text-[#C8924A]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#5A4232]">
                £
              </span>
              <input
                id="pricing-base-price"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] pl-7 pr-3 text-[13px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="pricing-sale-price"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
            >
              Sale Price
              {discount !== null && discount > 0 && (
                <span className="ml-2 font-normal normal-case text-emerald-400">
                  ({discount}% off)
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#5A4232]">
                £
              </span>
              <input
                id="pricing-sale-price"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
                disabled={type === "standard"}
                className="h-10 w-full rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] pl-7 pr-3 text-[13px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none disabled:pointer-events-none disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Validity dates */}
        {type !== "standard" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pricing-valid-from"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
              >
                Valid From
              </label>
              <input
                id="pricing-valid-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label
                htmlFor="pricing-valid-to"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
              >
                Valid To
              </label>
              <input
                id="pricing-valid-to"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Active toggle */}
        <div className="flex items-center justify-between rounded-[10px] border border-[#3D2E1E] bg-[#2E231A] px-4 py-3">
          <div>
            <p className="text-[13px] font-medium text-[#C8B99A]">Active</p>
            <p className="text-[11px] text-[#3D2E1E]">
              Show this price on the customer-facing site
            </p>
          </div>
          <button
            role="switch"
            aria-checked={isActive}
            aria-label="Active"
            onClick={() => setIsActive((v) => !v)}
            className={cn(
              "relative h-6 w-10 rounded-full border transition-all",
              isActive ? "border-[#C8924A] bg-[#C8924A]" : "border-[#3D2E1E] bg-[#2E231A]",
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                isActive ? "left-[18px]" : "left-0.5",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
