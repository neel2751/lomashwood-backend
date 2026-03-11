"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Search, Star, ChevronDown, Filter,
  TrendingUp, Gift, Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLoyalty } from "@/hooks/useLoyalty";

type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

interface LoyaltyEntry {
  id: string;
  customer: string;
  customerId: string;
  email: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  totalSpend: number;
  lastEarned: string;
  joinedAt: string;
}

const TIER_CONFIG: Record<LoyaltyTier, { bg: string; text: string; border: string; icon: string; threshold: string }> = {
  Bronze:   { bg: "bg-[#8B6B4A]/15",   text: "text-[#8B6B4A]",  border: "border-[#8B6B4A]/30", icon: "🥉", threshold: "0–499 pts"      },
  Silver:   { bg: "bg-[#9CA3AF]/15",   text: "text-[#9CA3AF]",  border: "border-[#9CA3AF]/30", icon: "🥈", threshold: "500–999 pts"    },
  Gold:     { bg: "bg-[#C8924A]/15",   text: "text-[#C8924A]",  border: "border-[#C8924A]/30", icon: "🥇", threshold: "1,000–1,999 pts"},
  Platinum: { bg: "bg-purple-400/10",  text: "text-purple-400", border: "border-purple-400/30",icon: "💎", threshold: "2,000+ pts"    },
};

function TierBadge({ tier }: { tier: LoyaltyTier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-semibold border", cfg.bg, cfg.text, cfg.border)}>
      {cfg.icon} {tier}
    </span>
  );
}

function PointsBar({ points, tier }: { points: number; tier: LoyaltyTier }) {
  const max = tier === "Bronze" ? 500 : tier === "Silver" ? 1000 : tier === "Gold" ? 2000 : 2000;
  const pct = Math.min((points / max) * 100, 100);
  const color = tier === "Platinum" ? "bg-purple-400" : tier === "Gold" ? "bg-[#C8924A]" : tier === "Silver" ? "bg-[#9CA3AF]" : "bg-[#8B6B4A]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#2E231A] overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-[#3D2E1E] shrink-0 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

export function LoyaltyTable() {
  const [search, setSearch]       = useState("");
  const [tierFilter, setTier]     = useState<"All" | LoyaltyTier>("All");

  const { data, isLoading, isError } = useLoyalty();

  const loyaltyEntries = ((data as { data?: LoyaltyEntry[] } | undefined)?.data ?? []) as LoyaltyEntry[];
  const filtered = loyaltyEntries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = e.customer.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    return matchSearch && (tierFilter === "All" || e.tier === tierFilter);
  });

  const totalPoints = loyaltyEntries.reduce((s, e) => s + e.points, 0);

  if (isLoading) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden p-8">
        <p className="text-center text-[#5A4232]">Loading loyalty data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden p-8">
        <p className="text-center text-red-400">Failed to load loyalty data.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Tier legend strip */}
      <div className="flex items-center gap-6 px-5 py-3 border-b border-[#2E231A] bg-[#1A100C] flex-wrap">
        {(Object.entries(TIER_CONFIG) as [LoyaltyTier, typeof TIER_CONFIG["Bronze"]][]).map(([tier, cfg]) => (
          <div key={tier} className="flex items-center gap-1.5 text-[11px]">
            <span>{cfg.icon}</span>
            <span className={cfg.text + " font-medium"}>{tier}</span>
            <span className="text-[#3D2E1E]">({cfg.threshold})</span>
          </div>
        ))}
        <div className="ml-auto text-[12px] text-[#5A4232]">
          Total active: <span className="text-[#E8D5B7] font-semibold">{totalPoints.toLocaleString()} pts</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]" />
        </div>

        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select
            value={tierFilter}
            onChange={(e) => setTier(e.target.value as "All" | LoyaltyTier)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Tiers</option>
            {(["Bronze","Silver","Gold","Platinum"] as LoyaltyTier[]).map((t) => (
              <option key={t} value={t} className="bg-[#1C1611]">{t}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <Link href="/customers/loyalty/adjust"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={14} /> Adjust Points
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Customer","Tier","Current Points","Progress","Lifetime Pts","Total Spend","Last Earned",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((entry) => (
              <tr key={entry.id} className="group hover:bg-[#221A12] transition-colors">
                {/* Customer */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8924A] to-[#6B4A20] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {entry.customer.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <Link href={`/customers/${entry.customerId}`}
                        className="text-[12.5px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors block">
                        {entry.customer}
                      </Link>
                      <p className="text-[10.5px] text-[#5A4232]">{entry.email}</p>
                    </div>
                  </div>
                </td>

                {/* Tier */}
                <td className="px-4 py-3.5">
                  <TierBadge tier={entry.tier} />
                </td>

                {/* Points */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-[#C8924A] fill-[#C8924A]" />
                    <span className="text-[14px] font-bold text-[#E8D5B7]">{entry.points.toLocaleString()}</span>
                  </div>
                </td>

                {/* Progress to next tier */}
                <td className="px-4 py-3.5 min-w-[120px]">
                  <PointsBar points={entry.points} tier={entry.tier} />
                </td>

                {/* Lifetime */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-[#7A6045]">
                    <TrendingUp size={11} />
                    {entry.lifetimePoints.toLocaleString()}
                  </div>
                </td>

                {/* Total spend */}
                <td className="px-4 py-3.5">
                  <span className="text-[12.5px] font-semibold text-[#E8D5B7]">£{entry.totalSpend.toLocaleString()}</span>
                </td>

                {/* Last earned */}
                <td className="px-4 py-3.5">
                  <span className="text-[11px] text-[#5A4232] whitespace-nowrap">{entry.lastEarned}</span>
                </td>

                {/* Adjust action */}
                <td className="px-4 py-3.5">
                  <Link href={`/customers/loyalty/adjust?customer=${entry.customerId}`}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] px-2 py-1 rounded-[6px] transition-all whitespace-nowrap">
                    <Gift size={11} /> Adjust
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} members</span>
      </div>
    </div>
  );
}