"use client";

import { useState } from "react";

import { Save, Loader2, ChevronDown, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

type RefundReason =
  | "damaged_delivery"
  | "wrong_item"
  | "changed_mind"
  | "quality_issue"
  | "duplicate_charge"
  | "installation_issue"
  | "other";

type RefundType = "full" | "partial";

const ORDER_OPTIONS = [
  { id: "1", orderNo: "#1048", customer: "James Thornton",  total: 8400  },
  { id: "2", orderNo: "#1047", customer: "Sarah Mitchell",  total: 3200  },
  { id: "3", orderNo: "#1046", customer: "Oliver Patel",    total: 14600 },
  { id: "5", orderNo: "#1044", customer: "Daniel Huang",    total: 2900  },
  { id: "7", orderNo: "#1042", customer: "Tom Hendricks",   total: 17200 },
  { id: "8", orderNo: "#1041", customer: "Aisha Okoye",     total: 4100  },
];

const REASON_LABELS: Record<RefundReason, string> = {
  damaged_delivery:  "Damaged on delivery",
  wrong_item:        "Wrong item delivered",
  changed_mind:      "Customer changed mind",
  quality_issue:     "Quality issue",
  duplicate_charge:  "Duplicate charge",
  installation_issue:"Installation issue",
  other:             "Other",
};

interface RefundFormProps {
  prefilledOrderId?: string;
  onSave?: (data: any) => void;
}

export function RefundForm({ prefilledOrderId, onSave }: RefundFormProps) {
  const [orderId, setOrderId]     = useState(prefilledOrderId ?? "");
  const [reason, setReason]       = useState<RefundReason>("damaged_delivery");
  const [type, setType]           = useState<RefundType>("full");
  const [amount, setAmount]       = useState("");
  const [notes, setNotes]         = useState("");
  const [notifyCustomer, setNotify] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const selectedOrder = ORDER_OPTIONS.find((o) => o.id === orderId);
  const maxAmount = selectedOrder?.total ?? 0;

  const refundAmount = type === "full"
    ? maxAmount
    : parseFloat(amount) || 0;

  const isValid = orderId && (type === "full" || (parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount));

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    onSave?.({ orderId, reason, type, amount: refundAmount, notes, notifyCustomer });
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";
  const selectCls = "appearance-none " + inputCls + " pr-8";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">New Refund Request</h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Process a refund for a customer order</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !isValid}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Submitted!" : saving ? "Submitting…" : "Submit Refund"}
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Order selector */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Order <span className="text-[#C8924A]">*</span>
          </label>
          <div className="relative">
            <select
              value={orderId}
              onChange={(e) => { setOrderId(e.target.value); setAmount(""); }}
              className={selectCls}
            >
              <option value="">Select order…</option>
              {ORDER_OPTIONS.map((o) => (
                <option key={o.id} value={o.id} className="bg-[#1C1611]">
                  {o.orderNo} — {o.customer} — £{o.total.toLocaleString()}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
          </div>

          {/* Order preview */}
          {selectedOrder && (
            <div className="mt-2 px-3 py-2 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] flex items-center justify-between">
              <span className="text-[12px] text-[#7A6045]">{selectedOrder.customer}</span>
              <span className="text-[12px] font-semibold text-[#C8924A]">
                Max: £{selectedOrder.total.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Reason <span className="text-[#C8924A]">*</span>
          </label>
          <div className="relative">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RefundReason)}
              className={selectCls}
            >
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-[#1C1611]">{label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
          </div>
        </div>

        {/* Refund type */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
            Refund Type
          </label>
          <div className="flex gap-2">
            {([
              { value: "full",    label: "Full Refund",    desc: `£${maxAmount.toLocaleString()}` },
              { value: "partial", label: "Partial Refund", desc: "Custom amount" },
            ] as { value: RefundType; label: string; desc: string }[]).map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => { setType(value); setAmount(""); }}
                className={cn(
                  "flex-1 flex flex-col items-start px-4 py-3 rounded-[10px] border transition-all text-left",
                  type === value
                    ? "bg-[#C8924A]/15 border-[#C8924A]/50"
                    : "bg-[#2E231A] border-[#3D2E1E] hover:border-[#C8924A]/30"
                )}
              >
                <span className={cn("text-[13px] font-medium", type === value ? "text-[#C8924A]" : "text-[#7A6045]")}>
                  {label}
                </span>
                <span className={cn("text-[11px] mt-0.5", type === value ? "text-[#C8924A]/70" : "text-[#3D2E1E]")}>
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Partial amount */}
        {type === "partial" && (
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
              Refund Amount <span className="text-[#C8924A]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232] text-[13px]">£</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={0}
                max={maxAmount}
                className="w-full h-10 pl-7 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
              />
            </div>
            {parseFloat(amount) > maxAmount && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-400">
                <AlertTriangle size={11} />
                Amount exceeds the order total of £{maxAmount.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Refund summary */}
        {selectedOrder && (
          <div className="px-4 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#5A4232]">Refund total</span>
              <span className="text-[16px] font-bold text-[#C8924A]">
                £{refundAmount > 0 ? refundAmount.toLocaleString() : "—"}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Internal Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any relevant context for this refund…"
            className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none"
          />
        </div>

        {/* Notify customer toggle */}
        <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
          <div>
            <p className="text-[13px] font-medium text-[#C8B99A]">Notify Customer</p>
            <p className="text-[11px] text-[#3D2E1E]">Send refund confirmation email to customer</p>
          </div>
          <button
            onClick={() => setNotify((v) => !v)}
            className={cn(
              "w-10 h-6 rounded-full border relative transition-all shrink-0",
              notifyCustomer ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#1C1611] border-[#3D2E1E]"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
              notifyCustomer ? "left-[18px]" : "left-0.5"
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}