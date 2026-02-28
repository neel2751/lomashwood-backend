"use client";

import { useState } from "react";
import { X, Download, FileSpreadsheet, FileText, FileJson, Calendar, ChevronDown, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ExportFormat = "csv" | "xlsx" | "json" | "pdf";
type ExportDataset =
  | "orders"
  | "appointments"
  | "customers"
  | "products"
  | "analytics_events"
  | "revenue"
  | "brochure_requests"
  | "reviews";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ElementType; ext: string }[] = [
  { value: "csv",  label: "CSV",   icon: FileText,        ext: ".csv"  },
  { value: "xlsx", label: "Excel", icon: FileSpreadsheet, ext: ".xlsx" },
  { value: "json", label: "JSON",  icon: FileJson,        ext: ".json" },
  { value: "pdf",  label: "PDF",   icon: FileText,        ext: ".pdf"  },
];

const DATASET_OPTIONS: { value: ExportDataset; label: string; description: string }[] = [
  { value: "orders",           label: "Orders",             description: "All order records with payment status" },
  { value: "appointments",     label: "Appointments",       description: "Booked consultations and slots"        },
  { value: "customers",        label: "Customers",          description: "Customer profiles and contact details" },
  { value: "products",         label: "Products",           description: "Product catalogue with pricing"        },
  { value: "analytics_events", label: "Analytics Events",   description: "GTM-tracked user interaction events"   },
  { value: "revenue",          label: "Revenue Report",     description: "Sales and revenue breakdown"           },
  { value: "brochure_requests",label: "Brochure Requests",  description: "Submitted brochure request forms"      },
  { value: "reviews",          label: "Customer Reviews",   description: "Submitted product and service reviews" },
];

const PRESET_RANGES = ["Last 7 days", "Last 30 days", "Last 90 days", "This month", "Last month", "This year", "Custom"];

export function ExportModal({ open, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [datasets, setDatasets] = useState<ExportDataset[]>(["orders"]);
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const toggleDataset = (ds: ExportDataset) =>
    setDatasets((prev) =>
      prev.includes(ds) ? prev.filter((d) => d !== ds) : [...prev, ds]
    );

  const handleExport = () => {
    if (!datasets.length) return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("done");
      setTimeout(() => { setStatus("idle"); onClose(); }, 1400);
    }, 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[520px] bg-[#1C1611] border border-[#2E231A] rounded-[18px] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-[9px] bg-[#C8924A]/15">
              <Download size={15} className="text-[#C8924A]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#E8D5B7]">Export Data</h2>
              <p className="text-[11px] text-[#5A4232]">Configure and download your report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Format */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FORMAT_OPTIONS.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-[10px] border transition-all",
                      format === f.value
                        ? "bg-[#C8924A]/15 border-[#C8924A]/40 text-[#C8924A]"
                        : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:border-[#C8924A]/20 hover:text-[#C8924A]"
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-[11px] font-medium">{f.label}</span>
                    <span className="text-[9px] opacity-60">{f.ext}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Datasets */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Data to Include
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {DATASET_OPTIONS.map((ds) => {
                const checked = datasets.includes(ds.value);
                return (
                  <button
                    key={ds.value}
                    onClick={() => toggleDataset(ds.value)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[9px] border text-left transition-all",
                      checked
                        ? "bg-[#C8924A]/10 border-[#C8924A]/30"
                        : "bg-[#2E231A] border-[#3D2E1E] hover:border-[#C8924A]/20"
                    )}
                  >
                    <div className={cn(
                      "shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all",
                      checked ? "bg-[#C8924A] border-[#C8924A]" : "border-[#3D2E1E]"
                    )}>
                      {checked && <span className="w-2 h-2 rounded-sm bg-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-[12.5px] font-medium", checked ? "text-[#E8D5B7]" : "text-[#7A6045]")}>
                        {ds.label}
                      </p>
                      <p className="text-[11px] text-[#3D2E1E] truncate">{ds.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Date Range
            </label>
            <div className="relative">
              <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8924A]" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full appearance-none h-9 pl-9 pr-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#C8B99A] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
              >
                {PRESET_RANGES.map((r) => (
                  <option key={r} value={r} className="bg-[#1C1611]">{r}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Options
            </label>
            <button
              onClick={() => setIncludeHeaders((v) => !v)}
              className="flex items-center gap-3 w-full text-left"
            >
              <div className={cn(
                "w-9 h-5 rounded-full border transition-all relative shrink-0",
                includeHeaders ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#2E231A] border-[#3D2E1E]"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                  includeHeaders ? "left-[18px]" : "left-0.5"
                )} />
              </div>
              <span className="text-[12.5px] text-[#7A6045]">Include column headers</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2E231A]">
          <span className="text-[11px] text-[#3D2E1E]">
            {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-[9px] text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!datasets.length || status !== "idle"}
              className={cn(
                "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
                status === "done"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {status === "loading" ? (
                <><Loader2 size={13} className="animate-spin" /> Exporting...</>
              ) : status === "done" ? (
                <><CheckCircle size={13} /> Downloaded!</>
              ) : (
                <><Download size={13} /> Export {format.toUpperCase()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}