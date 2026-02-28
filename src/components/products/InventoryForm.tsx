"use client";

import { useState } from "react";
import { Save, Loader2, Plus, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type AdjustType = "set" | "add" | "subtract";

interface InventoryFormProps {
  initialData?: {
    productTitle?: string;
    sku?: string;
    currentStock?: number;
    reserved?: number;
    minThreshold?: number;
  };
  onSave?: (data: any) => void;
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

  const inputCls = "w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  const isLow = available <= minThreshold && available > 0;
  const isOut = available <= 0;

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">Update Inventory</h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">
            {initialData?.productTitle ?? "Product"} ·{" "}
            <span className="font-mono">{initialData?.sku ?? "SKU"}</span>
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !adjustValue}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Updated!" : saving ? "Saving…" : "Update Stock"}
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Current stock summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Stock",  value: stock,     color: "text-[#E8D5B7]" },
            { label: "Reserved",     value: reserved,  color: "text-[#7A6045]" },
            { label: "Available",    value: available, color: isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
              <p className={cn("text-[22px] font-bold leading-none", color)}>{value}</p>
              <p className="text-[10px] text-[#3D2E1E] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Low stock warning */}
        {(isLow || isOut) && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-[9px] border text-[12px]",
            isOut
              ? "bg-red-400/10 border-red-400/20 text-red-400"
              : "bg-amber-400/10 border-amber-400/20 text-amber-400"
          )}>
            <AlertTriangle size={13} />
            {isOut ? "This item is out of stock." : `Stock is below minimum threshold of ${minThreshold} units.`}
          </div>
        )}

        {/* Adjustment type */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
            Adjustment Type
          </label>
          <div className="flex gap-2">
            {([
              { value: "set",      label: "Set",      icon: null    },
              { value: "add",      label: "Add",      icon: Plus    },
              { value: "subtract", label: "Remove",   icon: Minus   },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setAdjustType(value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[9px] text-[12.5px] font-medium border transition-all",
                  adjustType === value
                    ? "bg-[#C8924A]/15 border-[#C8924A]/50 text-[#C8924A]"
                    : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/30"
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
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            {adjustType === "set" ? "New Stock Level" : "Quantity"} <span className="text-[#C8924A]">*</span>
          </label>
          <input
            type="number"
            min={0}
            value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
          {adjustValue && (
            <p className="text-[11px] text-[#5A4232] mt-1">
              New total:{" "}
              <span className="text-[#C8924A] font-semibold">{previewNewStock()} units</span>
            </p>
          )}
        </div>

        {/* Min threshold */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Low Stock Threshold
          </label>
          <input
            type="number"
            min={0}
            value={minThreshold}
            onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
            className={inputCls}
          />
          <p className="text-[11px] text-[#3D2E1E] mt-1">Alert when available stock falls below this number</p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Reason / Notes
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Stock replenishment, damaged units…"
            className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}