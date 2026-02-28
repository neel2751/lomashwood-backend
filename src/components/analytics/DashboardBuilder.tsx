"use client";

import { useState } from "react";

import {
  LayoutDashboard, Plus, Trash2, GripVertical,
  BarChart3, TrendingUp, Users, ShoppingBag,
  CalendarCheck, PieChart, Table2, Save, Eye,
} from "lucide-react";

import { cn } from "@/lib/utils";

type WidgetType =
  | "metric_card"
  | "line_chart"
  | "bar_chart"
  | "pie_chart"
  | "funnel"
  | "table"
  | "cohort";

type WidgetSize = "sm" | "md" | "lg" | "full";

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  metric?: string;
  size: WidgetSize;
}

const WIDGET_LIBRARY: { type: WidgetType; label: string; icon: React.ElementType; defaultTitle: string }[] = [
  { type: "metric_card", label: "Metric Card",   icon: TrendingUp,     defaultTitle: "New Metric"       },
  { type: "line_chart",  label: "Line Chart",    icon: BarChart3,      defaultTitle: "Trend Chart"      },
  { type: "bar_chart",   label: "Bar Chart",     icon: BarChart3,      defaultTitle: "Bar Chart"        },
  { type: "pie_chart",   label: "Pie / Donut",   icon: PieChart,       defaultTitle: "Distribution"     },
  { type: "funnel",      label: "Funnel",        icon: TrendingUp,     defaultTitle: "Conversion Funnel"},
  { type: "table",       label: "Data Table",    icon: Table2,         defaultTitle: "Data Table"       },
  { type: "cohort",      label: "Cohort Table",  icon: Users,          defaultTitle: "Cohort Analysis"  },
];

const METRIC_OPTIONS = [
  "Total Revenue", "Orders", "Appointments", "Customers",
  "Brochure Requests", "Page Views", "Conversion Rate",
  "Avg. Order Value", "Refunds", "Bounce Rate",
];

const SIZE_OPTIONS: { value: WidgetSize; label: string; cols: string }[] = [
  { value: "sm",   label: "Small (1/4)",    cols: "col-span-1" },
  { value: "md",   label: "Medium (1/2)",   cols: "col-span-2" },
  { value: "lg",   label: "Large (3/4)",    cols: "col-span-3" },
  { value: "full", label: "Full Width",     cols: "col-span-4" },
];

const WIDGET_COLORS: Record<WidgetType, string> = {
  metric_card: "text-[#C8924A] bg-[#C8924A]/15",
  line_chart:  "text-[#6B8A9A] bg-[#6B8A9A]/15",
  bar_chart:   "text-[#8B6B4A] bg-[#8B6B4A]/15",
  pie_chart:   "text-purple-400 bg-purple-400/10",
  funnel:      "text-emerald-400 bg-emerald-400/10",
  table:       "text-amber-400 bg-amber-400/10",
  cohort:      "text-[#6B8A9A] bg-[#6B8A9A]/15",
};

function uid() { return Math.random().toString(36).slice(2, 8); }

export function DashboardBuilder() {
  const [dashName, setDashName] = useState("My Analytics Dashboard");
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "w1", type: "metric_card", title: "Total Revenue",     metric: "Total Revenue",    size: "sm" },
    { id: "w2", type: "metric_card", title: "Total Orders",      metric: "Orders",            size: "sm" },
    { id: "w3", type: "metric_card", title: "Appointments",      metric: "Appointments",      size: "sm" },
    { id: "w4", type: "metric_card", title: "Conversion Rate",   metric: "Conversion Rate",   size: "sm" },
    { id: "w5", type: "line_chart",  title: "Revenue Trend",     metric: "Total Revenue",     size: "md" },
    { id: "w6", type: "funnel",      title: "Booking Funnel",    metric: undefined,           size: "md" },
  ]);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  const addWidget = (type: WidgetType, defaultTitle: string) => {
    setWidgets((prev) => [
      ...prev,
      { id: uid(), type, title: defaultTitle, size: "sm" },
    ]);
  };

  const updateWidget = (id: string, field: keyof Widget, value: string) =>
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));

  const deleteWidget = (id: string) =>
    setWidgets((prev) => prev.filter((w) => w.id !== id));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sizeClass = (size: WidgetSize) =>
    SIZE_OPTIONS.find((s) => s.value === size)?.cols ?? "col-span-1";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Dashboard Builder</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Compose a custom analytics dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-all border",
              preview
                ? "bg-[#C8924A]/15 text-[#C8924A] border-[#C8924A]/30"
                : "bg-[#2E231A] text-[#7A6045] border-[#3D2E1E] hover:text-[#C8924A]"
            )}
          >
            <Eye size={13} />
            {preview ? "Editing" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-all",
              saved
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#C8924A] text-white hover:bg-[#B87E3E]"
            )}
          >
            <Save size={13} />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Dashboard name */}
      {!preview && (
        <div className="mb-5">
          <input
            type="text"
            value={dashName}
            onChange={(e) => setDashName(e.target.value)}
            className="w-full h-9 px-3 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[14px] font-semibold text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
          />
        </div>
      )}

      {preview ? (
        /* ── Preview mode ── */
        <div>
          <p className="text-[18px] font-bold text-[#E8D5B7] mb-4">{dashName}</p>
          <div className="grid grid-cols-4 gap-3">
            {widgets.map((w) => {
              const libItem = WIDGET_LIBRARY.find((l) => l.type === w.type);
              const Icon = libItem?.icon ?? LayoutDashboard;
              const colorClass = WIDGET_COLORS[w.type];
              return (
                <div
                  key={w.id}
                  className={cn(
                    "rounded-[12px] bg-[#2E231A] border border-[#3D2E1E] p-4",
                    "flex flex-col gap-2 min-h-[80px]",
                    sizeClass(w.size)
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-[7px] flex items-center justify-center", colorClass)}>
                    <Icon size={14} />
                  </div>
                  <p className="text-[12px] font-medium text-[#C8B99A]">{w.title}</p>
                  {w.metric && (
                    <p className="text-[11px] text-[#5A4232]">{w.metric}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Edit mode ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Widget library */}
          <div className="lg:col-span-1">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Add Widget
            </p>
            <div className="flex flex-col gap-1.5">
              {WIDGET_LIBRARY.map((lib) => {
                const Icon = lib.icon;
                const colorClass = WIDGET_COLORS[lib.type];
                return (
                  <button
                    key={lib.type}
                    onClick={() => addWidget(lib.type, lib.defaultTitle)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] hover:border-[#C8924A]/30 hover:bg-[#221A12] transition-all group"
                  >
                    <div className={cn("w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0", colorClass)}>
                      <Icon size={13} />
                    </div>
                    <span className="text-[12.5px] text-[#7A6045] group-hover:text-[#C8924A] transition-colors">
                      {lib.label}
                    </span>
                    <Plus size={12} className="ml-auto text-[#3D2E1E] group-hover:text-[#C8924A]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget list */}
          <div className="lg:col-span-2">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
              Dashboard Layout ({widgets.length} widgets)
            </p>
            <div className="flex flex-col gap-2">
              {widgets.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 rounded-[12px] border border-dashed border-[#2E231A] text-[#3D2E1E] text-[12px]">
                  <LayoutDashboard size={20} className="mb-2" />
                  Add widgets from the library
                </div>
              )}
              {widgets.map((w) => {
                const libItem = WIDGET_LIBRARY.find((l) => l.type === w.type);
                const Icon = libItem?.icon ?? LayoutDashboard;
                const colorClass = WIDGET_COLORS[w.type];
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 p-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E] group/widget"
                  >
                    {/* Drag handle */}
                    <GripVertical size={14} className="text-[#3D2E1E] cursor-grab shrink-0" />

                    {/* Icon */}
                    <div className={cn("w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0", colorClass)}>
                      <Icon size={13} />
                    </div>

                    {/* Title input */}
                    <input
                      type="text"
                      value={w.title}
                      onChange={(e) => updateWidget(w.id, "title", e.target.value)}
                      className="flex-1 bg-transparent text-[12.5px] text-[#C8B99A] focus:outline-none focus:text-[#E8D5B7] min-w-0 transition-colors"
                    />

                    {/* Metric selector (only for metric_card and chart types) */}
                    {["metric_card", "line_chart", "bar_chart"].includes(w.type) && (
                      <select
                        value={w.metric ?? ""}
                        onChange={(e) => updateWidget(w.id, "metric", e.target.value)}
                        className="h-7 px-2 rounded-[6px] bg-[#1C1611] border border-[#3D2E1E] text-[11px] text-[#7A6045] focus:outline-none focus:border-[#C8924A]/40 transition-colors"
                      >
                        <option value="">Select metric</option>
                        {METRIC_OPTIONS.map((m) => (
                          <option key={m} value={m} className="bg-[#1C1611]">{m}</option>
                        ))}
                      </select>
                    )}

                    {/* Size selector */}
                    <select
                      value={w.size}
                      onChange={(e) => updateWidget(w.id, "size", e.target.value as WidgetSize)}
                      className="h-7 px-2 rounded-[6px] bg-[#1C1611] border border-[#3D2E1E] text-[11px] text-[#7A6045] focus:outline-none focus:border-[#C8924A]/40 transition-colors"
                    >
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value} className="bg-[#1C1611]">{s.label}</option>
                      ))}
                    </select>

                    {/* Delete */}
                    <button
                      onClick={() => deleteWidget(w.id)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}