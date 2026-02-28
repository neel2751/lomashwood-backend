"use client";

import { cn } from "@/lib/utils";

interface CohortRow {
  cohort: string;
  size: number;
  weeks: (number | null)[];
}

// Each value is retention % for that week (null = future)
const COHORT_DATA: CohortRow[] = [
  { cohort: "Jan W1", size: 342, weeks: [100, 62, 48, 41, 36, 33, 30, 28] },
  { cohort: "Jan W2", size: 289, weeks: [100, 58, 44, 38, 33, 29, 27, null] },
  { cohort: "Jan W3", size: 314, weeks: [100, 64, 51, 43, 38, 34, null, null] },
  { cohort: "Jan W4", size: 276, weeks: [100, 60, 46, 39, 35, null, null, null] },
  { cohort: "Feb W1", size: 398, weeks: [100, 67, 53, 45, null, null, null, null] },
  { cohort: "Feb W2", size: 361, weeks: [100, 65, 50, null, null, null, null, null] },
  { cohort: "Feb W3", size: 423, weeks: [100, 69, null, null, null, null, null, null] },
  { cohort: "Feb W4", size: 391, weeks: [100, null, null, null, null, null, null, null] },
];

const WEEK_LABELS = ["W0", "W1", "W2", "W3", "W4", "W5", "W6", "W7"];

function getHeatColor(value: number): string {
  if (value >= 90) return "bg-[#C8924A] text-white";
  if (value >= 70) return "bg-[#C8924A]/70 text-white";
  if (value >= 50) return "bg-[#C8924A]/45 text-[#E8D5B7]";
  if (value >= 35) return "bg-[#C8924A]/25 text-[#C8B99A]";
  if (value >= 20) return "bg-[#C8924A]/15 text-[#9A7A5A]";
  return "bg-[#C8924A]/8 text-[#7A6045]";
}

export function CohortTable() {
  const avgRetention = WEEK_LABELS.map((_, wi) => {
    const vals = COHORT_DATA.map((r) => r.weeks[wi]).filter((v) => v !== null) as number[];
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(0) : null;
  });

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Customer Retention Cohorts</h3>
        <p className="text-[12px] text-[#5A4232] mt-0.5">
          Weekly retention rate (%) by acquisition cohort
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-[11px] text-[#5A4232]">Retention intensity:</span>
        {[
          { label: "100%", cls: "bg-[#C8924A]" },
          { label: "70%",  cls: "bg-[#C8924A]/70" },
          { label: "50%",  cls: "bg-[#C8924A]/45" },
          { label: "35%",  cls: "bg-[#C8924A]/25" },
          { label: "<20%", cls: "bg-[#C8924A]/8" },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn("w-4 h-4 rounded-[4px]", cls)} />
            <span className="text-[11px] text-[#5A4232]">{label}</span>
          </div>
        ))}
        <span className="text-[11px] text-[#3D2E1E] ml-1">· Gray = future</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] pb-2 pr-3 w-20">
                Cohort
              </th>
              <th className="text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] pb-2 pr-3 w-16">
                Size
              </th>
              {WEEK_LABELS.map((w) => (
                <th key={w} className="text-center text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] pb-2 w-12">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COHORT_DATA.map((row) => (
              <tr key={row.cohort}>
                <td className="text-[11.5px] font-medium text-[#9A7A5A] pr-3 whitespace-nowrap">
                  {row.cohort}
                </td>
                <td className="text-[11px] text-[#5A4232] pr-3">{row.size}</td>
                {row.weeks.map((val, wi) => (
                  <td key={wi} className="p-0">
                    {val !== null ? (
                      <div className={cn("flex items-center justify-center h-8 rounded-[6px] text-[11px] font-semibold", getHeatColor(val))}>
                        {val}%
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-8 rounded-[6px] bg-[#2E231A] text-[#3D2E1E] text-[11px]">
                        —
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Average row */}
            <tr className="border-t border-[#2E231A]">
              <td className="text-[11px] font-bold text-[#C8924A] pt-2 pr-3">Average</td>
              <td className="text-[11px] text-[#5A4232] pt-2 pr-3">
                {Math.round(COHORT_DATA.reduce((s, r) => s + r.size, 0) / COHORT_DATA.length)}
              </td>
              {avgRetention.map((avg, wi) => (
                <td key={wi} className="p-0 pt-2">
                  {avg !== null ? (
                    <div className={cn("flex items-center justify-center h-8 rounded-[6px] text-[11px] font-bold border border-[#C8924A]/20", getHeatColor(Number(avg)))}>
                      {avg}%
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-8 rounded-[6px] bg-[#2E231A] text-[#3D2E1E] text-[11px]">—</div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}