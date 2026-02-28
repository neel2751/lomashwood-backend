"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Save, Loader2, Star, Plus, Minus,
  RotateCcw, ChevronDown, AlertTriangle,
  TrendingUp, Gift, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdjustmentType = "add" | "remove" | "set";
type LoyaltyTier    = "Bronze" | "Silver" | "Gold" | "Platinum";

type AdjustmentReason =
  | "order_bonus"
  | "referral"
  | "goodwill"
  | "promotion"
  | "correction"
  | "redemption"
  | "expiry"
  | "other";

interface AuditEntry {
  id: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  actor: string;
  note: string;
  before: number;
  after: number;
  date: string;
}

const CUSTOMER_OPTIONS = [
  { id: "6", name: "Aisha Okoye",     email: "aisha.o@email.com",  points: 1105, tier: "Platinum" as LoyaltyTier },
  { id: "1", name: "James Thornton",  email: "james.t@email.com",  points: 920,  tier: "Gold"     as LoyaltyTier },
  { id: "7", name: "Tom Hendricks",   email: "tom.h@email.com",    points: 860,  tier: "Gold"     as LoyaltyTier },
  { id: "3", name: "Oliver Patel",    email: "oliver.p@email.com", points: 730,  tier: "Silver"   as LoyaltyTier },
  { id: "2", name: "Priya Sharma",    email: "priya.s@email.com",  points: 455,  tier: "Silver"   as LoyaltyTier },
  { id: "4", name: "Emma Lawson",     email: "emma.l@email.com",   points: 340,  tier: "Bronze"   as LoyaltyTier },
  { id: "5", name: "Daniel Huang",    email: "daniel.h@email.com", points: 145,  tier: "Bronze"   as LoyaltyTier },
  { id: "8", name: "Sarah Mitchell",  email: "sarah.m@email.com",  points: 0,    tier: "Bronze"   as LoyaltyTier },
];

const REASON_LABELS: Record<AdjustmentReason, string> = {
  order_bonus:  "Order Bonus",
  referral:     "Referral Reward",
  goodwill:     "Goodwill Gesture",
  promotion:    "Promotion / Campaign",
  correction:   "Error Correction",
  redemption:   "Points Redemption",
  expiry:       "Points Expiry",
  other:        "Other",
};

const TIER_CONFIG: Record<LoyaltyTier, { bg: string; text: string; border: string; icon: string; min: number; max: number | null }> = {
  Bronze:   { bg: "bg-[#8B6B4A]/15",  text: "text-[#8B6B4A]",  border: "border-[#8B6B4A]/30", icon: "🥉", min: 0,    max: 499  },
  Silver:   { bg: "bg-[#9CA3AF]/15",  text: "text-[#9CA3AF]",  border: "border-[#9CA3AF]/30", icon: "🥈", min: 500,  max: 999  },
  Gold:     { bg: "bg-[#C8924A]/15",  text: "text-[#C8924A]",  border: "border-[#C8924A]/30", icon: "🥇", min: 1000, max: 1999 },
  Platinum: { bg: "bg-purple-400/10", text: "text-purple-400", border: "border-purple-400/30", icon: "💎", min: 2000, max: null },
};

function getTier(points: number): LoyaltyTier {
  if (points >= 2000) return "Platinum";
  if (points >= 1000) return "Gold";
  if (points >= 500)  return "Silver";
  return "Bronze";
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: "a1", type: "add",    amount: 920,  reason: "Order Bonus",     actor: "System",      note: "5 pts/£ on order #1048", before: 0,   after: 920,  date: "28 Feb 2025, 09:15" },
  { id: "a2", type: "add",    amount: 100,  reason: "Goodwill Gesture",actor: "Sarah A.",     note: "Compensation for delivery delay.", before: 920, after: 1020, date: "10 Mar 2025, 11:00" },
  { id: "a3", type: "remove", amount: 100,  reason: "Error Correction", actor: "Admin",       note: "Duplicate points removed.", before: 1020,after: 920,  date: "15 Mar 2025, 14:20" },
];

interface LoyaltyAdjustFormProps {
  prefilledCustomerId?: string;
  onSave?: (data: any) => void;
}

export function LoyaltyAdjustForm({ prefilledCustomerId, onSave }: LoyaltyAdjustFormProps) {
  const [customerId, setCustomerId] = useState(prefilledCustomerId ?? "");
  const [adjType, setAdjType]       = useState<AdjustmentType>("add");
  const [amount, setAmount]         = useState("");
  const [reason, setReason]         = useState<AdjustmentReason>("goodwill");
  const [note, setNote]             = useState("");
  const [notify, setNotify]         = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [history, setHistory]       = useState<AuditEntry[]>(MOCK_AUDIT);

  const selectedCustomer = CUSTOMER_OPTIONS.find((c) => c.id === customerId);
  const currentPoints    = selectedCustomer?.points ?? 0;
  const parsedAmount     = parseInt(amount) || 0;

  const previewPoints =
    adjType === "add"    ? currentPoints + parsedAmount :
    adjType === "remove" ? Math.max(0, currentPoints - parsedAmount) :
    parsedAmount;

  const previewTier    = getTier(previewPoints);
  const currentTier    = selectedCustomer ? selectedCustomer.tier : "Bronze";
  const tierChanged    = previewTier !== currentTier;
  const tierUpgrade    = tierChanged && ["Bronze","Silver","Gold","Platinum"].indexOf(previewTier) > ["Bronze","Silver","Gold","Platinum"].indexOf(currentTier);
  const tierDowngrade  = tierChanged && !tierUpgrade;

  const isValid = customerId && parsedAmount > 0 && (adjType !== "remove" || parsedAmount <= currentPoints);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));

    const newEntry: AuditEntry = {
      id:     `a${Date.now()}`,
      type:   adjType,
      amount: parsedAmount,
      reason: REASON_LABELS[reason],
      actor:  "Admin",
      note:   note || "—",
      before: currentPoints,
      after:  previewPoints,
      date:   new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    setHistory((h) => [newEntry, ...h]);
    setSaving(false);
    setSaved(true);
    onSave?.({ customerId, adjType, amount: parsedAmount, reason, note, notify });
    setAmount("");
    setNote("");
    setTimeout(() => setSaved(false), 2500);
  };

  const selectCls = "appearance-none w-full h-10 px-3 pr-8 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Form card */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#E8D5B7] flex items-center gap-2">
              <Gift size={15} className="text-[#C8924A]" />
              Adjust Loyalty Points
            </h2>
            <p className="text-[12px] text-[#5A4232] mt-0.5">Manually add, remove, or set a customer's loyalty balance</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
              saved  ? "bg-emerald-500/20 text-emerald-400"
                     : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? "Saved!" : saving ? "Saving…" : "Apply Adjustment"}
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Customer selector */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
              Customer <span className="text-[#C8924A]">*</span>
            </label>
            <div className="relative">
              <select
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); setAmount(""); }}
                className={selectCls}
              >
                <option value="">Select customer…</option>
                {CUSTOMER_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1C1611]">
                    {c.name} — {c.tier} · {c.points.toLocaleString()} pts
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>

            {/* Customer preview strip */}
            {selectedCustomer && (
              <div className="mt-2 flex items-center justify-between px-4 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8924A] to-[#6B4A20] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {selectedCustomer.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-medium text-[#C8B99A]">{selectedCustomer.name}</p>
                    <p className="text-[11px] text-[#5A4232]">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star size={11} className="text-[#C8924A] fill-[#C8924A]" />
                    <span className="text-[14px] font-bold text-[#E8D5B7]">{selectedCustomer.points.toLocaleString()}</span>
                    <span className="text-[11px] text-[#5A4232]">pts</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                    TIER_CONFIG[selectedCustomer.tier].bg,
                    TIER_CONFIG[selectedCustomer.tier].text,
                    TIER_CONFIG[selectedCustomer.tier].border
                  )}>
                    {TIER_CONFIG[selectedCustomer.tier].icon} {selectedCustomer.tier}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Adjustment type */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "add",    label: "Add Points",    icon: Plus,      desc: "Credit to balance",  color: "text-emerald-400" },
                { value: "remove", label: "Remove Points", icon: Minus,     desc: "Deduct from balance", color: "text-red-400"    },
                { value: "set",    label: "Set Balance",   icon: RotateCcw, desc: "Override total",     color: "text-[#C8924A]"  },
              ] as { value: AdjustmentType; label: string; icon: React.ElementType; desc: string; color: string }[]).map(({ value, label, icon: Icon, desc, color }) => (
                <button
                  key={value}
                  onClick={() => setAdjType(value)}
                  className={cn(
                    "flex flex-col items-start gap-1 px-4 py-3 rounded-[10px] border transition-all text-left",
                    adjType === value
                      ? "bg-[#C8924A]/15 border-[#C8924A]/50"
                      : "bg-[#2E231A] border-[#3D2E1E] hover:border-[#C8924A]/30"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className={adjType === value ? color : "text-[#5A4232]"} />
                    <span className={cn("text-[12.5px] font-semibold",
                      adjType === value ? color : "text-[#7A6045]")}>
                      {label}
                    </span>
                  </div>
                  <span className={cn("text-[10.5px]", adjType === value ? "text-[#C8924A]/70" : "text-[#3D2E1E]")}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount input + reason row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Points amount */}
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
                {adjType === "set" ? "New Balance" : "Points"}{" "}
                <span className="text-[#C8924A]">*</span>
              </label>
              <div className="relative">
                <Star size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8924A]" />
                <input
                  type="number"
                  min={0}
                  max={adjType === "remove" ? currentPoints : undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
                />
              </div>
              {adjType === "remove" && parsedAmount > currentPoints && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-red-400">
                  <AlertTriangle size={10} /> Cannot remove more than current balance ({currentPoints} pts)
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
                Reason <span className="text-[#C8924A]">*</span>
              </label>
              <div className="relative">
                <select value={reason} onChange={(e) => setReason(e.target.value as AdjustmentReason)} className={selectCls}>
                  {(Object.entries(REASON_LABELS) as [AdjustmentReason, string][]).map(([v, l]) => (
                    <option key={v} value={v} className="bg-[#1C1611]">{l}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Internal note */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
              Internal Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional — add context for the audit trail…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none"
            />
          </div>

          {/* Preview panel */}
          {selectedCustomer && parsedAmount > 0 && (
            <div className={cn(
              "rounded-[12px] border p-4",
              tierUpgrade   ? "bg-emerald-400/5 border-emerald-400/20" :
              tierDowngrade ? "bg-amber-400/5  border-amber-400/20"   :
                              "bg-[#2E231A]    border-[#3D2E1E]"
            )}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-3 flex items-center gap-1.5">
                <Info size={11} /> Preview
              </p>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Before */}
                <div className="text-center">
                  <p className="text-[10px] text-[#3D2E1E] uppercase tracking-wider mb-1">Before</p>
                  <p className="text-[20px] font-bold text-[#E8D5B7]">{currentPoints.toLocaleString()}</p>
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                    TIER_CONFIG[currentTier].bg,
                    TIER_CONFIG[currentTier].text,
                    TIER_CONFIG[currentTier].border
                  )}>
                    {TIER_CONFIG[currentTier].icon} {currentTier}
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1 text-[#3D2E1E]">
                  <div className="flex items-center gap-0.5">
                    {adjType === "add"    && <Plus  size={14} className="text-emerald-400" />}
                    {adjType === "remove" && <Minus size={14} className="text-red-400" />}
                    {adjType === "set"    && <RotateCcw size={14} className="text-[#C8924A]" />}
                    <span className={cn("text-[14px] font-bold",
                      adjType === "add"    ? "text-emerald-400" :
                      adjType === "remove" ? "text-red-400"     : "text-[#C8924A]"
                    )}>
                      {adjType === "set" ? "" : ""}{parsedAmount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[12px]">→</span>
                </div>

                {/* After */}
                <div className="text-center">
                  <p className="text-[10px] text-[#3D2E1E] uppercase tracking-wider mb-1">After</p>
                  <p className={cn("text-[20px] font-bold",
                    tierUpgrade ? "text-emerald-400" : tierDowngrade ? "text-amber-400" : "text-[#C8924A]"
                  )}>
                    {previewPoints.toLocaleString()}
                  </p>
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                    TIER_CONFIG[previewTier].bg,
                    TIER_CONFIG[previewTier].text,
                    TIER_CONFIG[previewTier].border
                  )}>
                    {TIER_CONFIG[previewTier].icon} {previewTier}
                  </span>
                </div>
              </div>

              {/* Tier change callout */}
              {tierChanged && (
                <div className={cn(
                  "mt-3 flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium",
                  tierUpgrade ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                )}>
                  <TrendingUp size={13} />
                  {tierUpgrade
                    ? `Tier upgrade: ${currentTier} → ${previewTier}`
                    : `Tier downgrade: ${currentTier} → ${previewTier}`
                  }
                </div>
              )}
            </div>
          )}

          {/* Notify customer */}
          <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
            <div>
              <p className="text-[13px] font-medium text-[#C8B99A]">Notify Customer</p>
              <p className="text-[11px] text-[#3D2E1E]">Send a loyalty points update email to the customer</p>
            </div>
            <button
              onClick={() => setNotify((v) => !v)}
              className={cn(
                "w-10 h-6 rounded-full border relative transition-all shrink-0",
                notify ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#1C1611] border-[#3D2E1E]"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                notify ? "left-[18px]" : "left-0.5"
              )} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit trail */}
      {selectedCustomer && (
        <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
            <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Adjustment History</h3>
            <Link href={`/customers/${selectedCustomer.id}`}
              className="text-[11px] text-[#C8924A] hover:underline">
              View customer profile →
            </Link>
          </div>
          <div className="divide-y divide-[#2E231A]">
            {history.length === 0 && (
              <div className="px-5 py-6 text-center text-[12px] text-[#3D2E1E]">No adjustment history</div>
            )}
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between px-5 py-3.5 gap-4 hover:bg-[#221A12] transition-colors">
                <div className="flex items-start gap-3">
                  {/* Type indicator */}
                  <div className={cn(
                    "mt-0.5 w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0",
                    entry.type === "add"    ? "bg-emerald-400/15" :
                    entry.type === "remove" ? "bg-red-400/15"     : "bg-[#C8924A]/15"
                  )}>
                    {entry.type === "add"    && <Plus      size={13} className="text-emerald-400" />}
                    {entry.type === "remove" && <Minus     size={13} className="text-red-400"     />}
                    {entry.type === "set"    && <RotateCcw size={13} className="text-[#C8924A]"   />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-[13px] font-semibold",
                        entry.type === "add"    ? "text-emerald-400" :
                        entry.type === "remove" ? "text-red-400"     : "text-[#C8924A]"
                      )}>
                        {entry.type === "add" ? "+" : entry.type === "remove" ? "−" : ""}{entry.amount.toLocaleString()} pts
                      </span>
                      <span className="text-[11px] text-[#5A4232] bg-[#2E231A] px-2 py-0.5 rounded-full">
                        {entry.reason}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#5A4232] mt-0.5">{entry.note}</p>
                    <p className="text-[10.5px] text-[#3D2E1E] mt-0.5">
                      {entry.before.toLocaleString()} → {entry.after.toLocaleString()} pts · by {entry.actor}
                    </p>
                  </div>
                </div>
                <span className="text-[10.5px] text-[#3D2E1E] shrink-0 whitespace-nowrap mt-0.5">
                  {entry.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}