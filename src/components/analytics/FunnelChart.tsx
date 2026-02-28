"use client";

import { cn } from "@/lib/utils";

interface FunnelStep {
  label: string;
  count: number;
  dropOff?: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  title?: string;
  description?: string;
}

const DEFAULT_STEPS: FunnelStep[] = [
  { label: "Product Page View",      count: 9420 },
  { label: "Colour / Filter Applied", count: 5640, dropOff: 40.1 },
  { label: "Product Detail View",    count: 4820, dropOff: 14.5 },
  { label: "CTA Clicked",            count: 2310, dropOff: 52.1 },
  { label: "Appointment Form Open",  count: 1480, dropOff: 35.9 },
  { label: "Appointment Submitted",  count: 641,  dropOff: 56.7 },
];

const STEP_COLORS = [
  "#C8924A",
  "#B87E3E",
  "#A86B32",
  "#8B5E2A",
  "#6B4A20",
  "#4A3214",
];

export function FunnelChart({
  steps = DEFAULT_STEPS,
  title = "Appointment Booking Funnel",
  description = "Conversion path from product view to booked appointment",
}: FunnelChartProps) {
  const maxCount = steps[0]?.count ?? 1;

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-[14px] font-semibold text-[#E8D5B7]">{title}</h3>
        <p className="text-[12px] text-[#5A4232] mt-0.5">{description}</p>
      </div>

      {/* Funnel steps */}
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const pct = (step.count / maxCount) * 100;
          const conversionFromTop = ((step.count / maxCount) * 100).toFixed(1);
          const color = STEP_COLORS[i] ?? STEP_COLORS[STEP_COLORS.length - 1];

          return (
            <div key={step.label} className="group">
              {/* Drop-off indicator */}
              {step.dropOff !== undefined && (
                <div className="flex items-center gap-2 mb-1 pl-2">
                  <div className="w-px h-3 bg-[#2E231A]" />
                  <span className="text-[10.5px] text-red-400 font-medium">
                    ↓ {step.dropOff}% drop-off
                  </span>
                </div>
              )}

              {/* Step bar */}
              <div className="relative flex items-center gap-3">
                {/* Step number */}
                <span className="shrink-0 text-[10px] font-bold text-[#3D2E1E] w-4 text-right">
                  {i + 1}
                </span>

                {/* Bar container */}
                <div className="flex-1 relative h-10 bg-[#2E231A] rounded-[8px] overflow-hidden">
                  {/* Filled bar */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-[8px] transition-all duration-700 flex items-center"
                    style={{ width: `${pct}%`, background: `${color}` }}
                  >
                    {/* Label inside bar (if wide enough) */}
                    {pct > 40 && (
                      <span className="ml-3 text-[11px] font-medium text-white/90 truncate">
                        {step.label}
                      </span>
                    )}
                  </div>

                  {/* Label outside (if bar too narrow) */}
                  {pct <= 40 && (
                    <span className="absolute left-[calc(var(--w)+8px)] top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#7A6045] truncate"
                      style={{ "--w": `${pct}%` } as React.CSSProperties}
                    >
                      {step.label}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="shrink-0 text-right min-w-[80px]">
                  <p className="text-[13px] font-bold text-[#E8D5B7] leading-none">
                    {step.count.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#5A4232] leading-none mt-0.5">
                    {conversionFromTop}% of total
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-5 pt-4 border-t border-[#2E231A] flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#5A4232]">Overall conversion</p>
          <p className="text-[18px] font-bold text-[#C8924A]">
            {((steps[steps.length - 1]?.count / maxCount) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#5A4232]">Total converted</p>
          <p className="text-[18px] font-bold text-[#E8D5B7]">
            {steps[steps.length - 1]?.count.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}