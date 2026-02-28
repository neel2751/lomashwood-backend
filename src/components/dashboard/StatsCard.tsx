"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: number; // percentage, e.g. 12.5 or -3.2
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon: Icon,
  iconColor = "text-[#C8924A]",
  iconBg = "bg-[#C8924A]/15",
  prefix,
  suffix,
  loading = false,
}: StatsCardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral
    ? "text-[#5A4232]"
    : isPositive
    ? "text-emerald-400"
    : "text-red-400";
  const trendBg = isNeutral
    ? "bg-[#2E231A]"
    : isPositive
    ? "bg-emerald-400/10"
    : "bg-red-400/10";

  if (loading) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#2E231A]" />
          <div className="w-16 h-5 rounded-full bg-[#2E231A]" />
        </div>
        <div className="w-24 h-7 rounded-lg bg-[#2E231A] mb-2" />
        <div className="w-32 h-4 rounded bg-[#2E231A]" />
      </div>
    );
  }

  return (
    <div className="group relative rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5 hover:border-[#C8924A]/30 transition-all duration-300 overflow-hidden">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[#C8924A]/5 to-transparent rounded-[16px]" />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div className={cn("flex items-center justify-center w-10 h-10 rounded-[10px]", iconBg)}>
          <Icon size={18} className={iconColor} strokeWidth={1.8} />
        </div>

        {/* Trend badge */}
        <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold", trendBg, trendColor)}>
          <TrendIcon size={11} />
          {isNeutral ? "0%" : `${isPositive ? "+" : ""}${change.toFixed(1)}%`}
        </span>
      </div>

      {/* Value */}
      <p className="text-[26px] font-bold text-[#E8D5B7] leading-none tracking-tight mb-1">
        {prefix && <span className="text-[16px] text-[#7A6045] mr-0.5">{prefix}</span>}
        {value}
        {suffix && <span className="text-[16px] text-[#7A6045] ml-0.5">{suffix}</span>}
      </p>

      {/* Label + change description */}
      <p className="text-[12px] text-[#5A4232] leading-snug">
        <span className="text-[#7A6045]">{title}</span>
        <span className="mx-1">·</span>
        {changeLabel}
      </p>
    </div>
  );
}