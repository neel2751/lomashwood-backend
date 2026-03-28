"use client";

import { useState } from "react";

import { Save, Loader2, Plus, Minus, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

type AdjustType = "set" | "add" | "subtract";

interface InventoryFormData {
  stock: number;
  minThreshold: number;
  reason: string;
}

interface InventoryFormProps {
  initialData?: {
    productTitle?: string;
    sku?: string;
    currentStock?: number;
    reserved?: number;
    minThreshold?: number;
  };
  onSave?: (data: InventoryFormData) => void;
}

export function InventoryForm({ initialData, onSave }: InventoryFormProps) {
  const [stock, setStock] = useState(initialData?.currentStock ?? 0);
  const [minThreshold, setMinThreshold] = useState(initialData?.minThreshold ?? 5);
  const [adjustType, setAdjustType] = useState<AdjustType>("set");
  const [adjustValue, setAdjustValue] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reserved = initialData?.reserved ?? 0;
  const available = stock - reserved;

  const previewNewStock = () => {
    const val = parseInt(adjustValue) || 0;
    if (adjustType === "set") return val;
    if (adjustType === "add") return stock + val;
    return Math.max(0, stock - val);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const newStock = previewNewStock();
    await new Promise((r) => setTimeout(r, 900));
    setStock(newStock);
    setAdjustValue("");
    setSaving(false);
    setSaved(true);
    onSave?.({ stock: newStock, minThreshold, reason });
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls =
    "w-full h-10 rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[13px] text-[#1A1A18] placeholder:text-[#8B8A86] focus:outline-none focus:border-[#C8924A]/60 transition-colors";

  const isLow = available <= minThreshold && available > 0;
  const isOut = available <= 0;

  return (
    <div className="max-w-lg overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2E231A] px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">Update Inventory</h2>
          <p className="mt-0.5 text-[12px] text-[#5A4232]">
            {initialData?.productTitle ?? "Product"} ·{" "}
            <span className="font-mono">{initialData?.sku ?? "SKU"}</span>
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !adjustValue}
          className={cn(
            "flex h-9 items-center gap-2 rounded-[9px] px-4 text-[12.5px] font-medium transition-all",
            saved
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Updated!" : saving ? "Saving…" : "Update Stock"}
        </button>
      </div>

      <div className="flex flex-col gap-5 p-6">
        {/* Current stock summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Stock", value: stock, color: "text-[#E8D5B7]" },
            { label: "Reserved", value: reserved, color: "text-[#7A6045]" },
            {
              label: "Available",
              value: available,
              color: isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-emerald-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-[10px] border border-[#3D2E1E] bg-[#2E231A] p-3 text-center"
            >
              <p className={cn("text-[22px] font-bold leading-none", color)}>{value}</p>
              <p className="mt-1 text-[10px] text-[#3D2E1E]">{label}</p>
            </div>
          ))}
        </div>

        {/* Low stock warning */}
        {(isLow || isOut) && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-[9px] border px-3 py-2.5 text-[12px]",
              isOut
                ? "border-red-400/20 bg-red-400/10 text-red-400"
                : "border-amber-400/20 bg-amber-400/10 text-amber-400",
            )}
          >
            <AlertTriangle size={13} />
            {isOut
              ? "This item is out of stock."
              : `Stock is below minimum threshold of ${minThreshold} units.`}
          </div>
        )}

        {/* Adjustment type */}
        <div>
          <p className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
            Adjustment Type
          </p>
          <div className="flex gap-2" role="group" aria-label="Adjustment Type">
            {(
              [
                { value: "set", label: "Set", icon: null },
                { value: "add", label: "Add", icon: Plus },
                { value: "subtract", label: "Remove", icon: Minus },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setAdjustType(value)}
                aria-pressed={adjustType === value}
                className={cn(
                  "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[9px] border text-[12.5px] font-medium transition-all",
                  adjustType === value
                    ? "border-[#C8924A]/50 bg-[#C8924A]/15 text-[#C8924A]"
                    : "border-[#3D2E1E] bg-[#2E231A] text-[#5A4232] hover:border-[#C8924A]/30 hover:text-[#C8924A]",
                )}
              >
                {Icon && <Icon size={13} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity input */}
        <div>
          <label
            htmlFor="adjust-quantity"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            {adjustType === "set" ? "New Stock Level" : "Quantity"}{" "}
            <span className="text-[#C8924A]">*</span>
          </label>
          <input
            id="adjust-quantity"
            type="number"
            min={0}
            value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
          {adjustValue && (
            <p className="mt-1 text-[11px] text-[#5A4232]">
              New total:{" "}
              <span className="font-semibold text-[#C8924A]">{previewNewStock()} units</span>
            </p>
          )}
        </div>

        {/* Min threshold */}
        <div>
          <label
            htmlFor="min-threshold"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Low Stock Threshold
          </label>
          <input
            id="min-threshold"
            type="number"
            min={0}
            value={minThreshold}
            onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-[#3D2E1E]">
            Alert when available stock falls below this number
          </p>
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor="reason-notes"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Reason / Notes
          </label>
          <textarea
            id="reason-notes"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Stock replenishment, damaged units…"
            className="w-full resize-none rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 py-2.5 text-[13px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
