"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = "vs prev period",
  icon: Icon,
  iconColor = "text-[#C8924A]",
  iconBg = "bg-[#C8924A]/15",
  prefix,
  suffix,
  description,
  loading = false,
  size = "md",
}: MetricCardProps) {
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === undefined || change === 0;
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
        <div className="flex justify-between mb-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#2E231A]" />
          <div className="w-16 h-5 rounded-full bg-[#2E231A]" />
        </div>
        <div className="w-28 h-7 rounded-lg bg-[#2E231A] mb-2" />
        <div className="w-36 h-4 rounded bg-[#2E231A]" />
      </div>
    );
  }

  return (
    <div className="group relative rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5 hover:border-[#C8924A]/30 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[#C8924A]/5 to-transparent rounded-[16px]" />

      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-[10px]", iconBg)}>
            <Icon size={18} className={iconColor} strokeWidth={1.8} />
          </div>
        )}
        {change !== undefined && (
          <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ml-auto", trendBg, trendColor)}>
            <TrendIcon size={11} />
            {isNeutral ? "0%" : `${isPositive ? "+" : ""}${change.toFixed(1)}%`}
          </span>
        )}
      </div>

      <p className={cn(
        "font-bold text-[#E8D5B7] leading-none tracking-tight mb-1",
        size === "lg" ? "text-[32px]" : size === "sm" ? "text-[20px]" : "text-[26px]"
      )}>
        {prefix && <span className="text-[16px] text-[#7A6045] mr-0.5">{prefix}</span>}
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-[16px] text-[#7A6045] ml-0.5">{suffix}</span>}
      </p>

      <p className="text-[12px] text-[#5A4232]">
        <span className="text-[#7A6045]">{title}</span>
        {change !== undefined && (
          <>
            <span className="mx-1">·</span>
            {changeLabel}
          </>
        )}
      </p>

      {description && (
        <p className="text-[11px] text-[#3D2E1E] mt-1.5 leading-snug">{description}</p>
      )}
    </div>
  );
}