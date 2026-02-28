"use client";

import { useState } from "react";

import { Plus, Trash2, GripVertical, ChevronDown, Save } from "lucide-react";

import { cn } from "@/lib/utils";

import { FunnelChart } from "./FunnelChart";

type EventOption = { label: string; value: string };

const EVENT_OPTIONS: EventOption[] = [
  { label: "Page View",               value: "page_view"              },
  { label: "Product Detail View",     value: "product_detail_view"    },
  { label: "Colour Filter Applied",   value: "colour_filter_applied"  },
  { label: "CTA Clicked",             value: "cta_click"              },
  { label: "Appointment Form Open",   value: "appointment_form_open"  },
  { label: "Appointment Submitted",   value: "appointment_submit"     },
  { label: "Brochure Request Submit", value: "brochure_request_submit"},
  { label: "Showroom Find Click",     value: "showroom_find_click"    },
  { label: "Finance Page View",       value: "finance_page_view"      },
  { label: "Business Enquiry Submit", value: "business_enquiry_submit"},
];

interface FunnelStep {
  id: string;
  eventValue: string;
  eventLabel: string;
  pagePath: string;
}

const DEFAULT_STEPS: FunnelStep[] = [
  { id: "s1", eventValue: "page_view",           eventLabel: "Page View",             pagePath: "/kitchens"         },
  { id: "s2", eventValue: "colour_filter_applied",eventLabel: "Colour Filter Applied", pagePath: "/kitchens"         },
  { id: "s3", eventValue: "product_detail_view", eventLabel: "Product Detail View",   pagePath: "/kitchens/*"       },
  { id: "s4", eventValue: "appointment_submit",  eventLabel: "Appointment Submitted", pagePath: "/book-appointment" },
];

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

interface StepRowProps {
  step: FunnelStep;
  index: number;
  total: number;
  onChange: (id: string, field: keyof FunnelStep, value: string) => void;
  onDelete: (id: string) => void;
}

function StepRow({ step, index, total, onChange, onDelete }: StepRowProps) {
  return (
    <div className="flex items-center gap-2 group/row">
      {/* Drag handle */}
      <div className="shrink-0 cursor-grab text-[#3D2E1E] group-hover/row:text-[#5A4232] transition-colors">
        <GripVertical size={14} />
      </div>

      {/* Step number */}
      <span className="shrink-0 w-5 text-[11px] font-bold text-[#5A4232] text-center">
        {index + 1}
      </span>

      {/* Event selector */}
      <div className="relative flex-1 min-w-0">
        <select
          value={step.eventValue}
          onChange={(e) => {
            const opt = EVENT_OPTIONS.find((o) => o.value === e.target.value);
            onChange(step.id, "eventValue", e.target.value);
            onChange(step.id, "eventLabel", opt?.label ?? e.target.value);
          }}
          className={cn(
            "w-full appearance-none h-9 pl-3 pr-8 rounded-[8px] text-[12.5px]",
            "bg-[#2E231A] border border-[#3D2E1E] text-[#C8B99A]",
            "focus:outline-none focus:border-[#C8924A]/50",
            "transition-colors"
          )}
        >
          {EVENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1C1611]">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
      </div>

      {/* Page path */}
      <input
        type="text"
        value={step.pagePath}
        onChange={(e) => onChange(step.id, "pagePath", e.target.value)}
        placeholder="/path or *"
        className={cn(
          "w-[160px] h-9 px-3 rounded-[8px] text-[12px] font-mono",
          "bg-[#2E231A] border border-[#3D2E1E] text-[#7A6045]",
          "placeholder:text-[#3D2E1E]",
          "focus:outline-none focus:border-[#C8924A]/50 transition-colors"
        )}
      />

      {/* Delete */}
      <button
        onClick={() => onDelete(step.id)}
        disabled={total <= 2}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-[7px] text-[#3D2E1E] hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export function FunnelBuilder() {
  const [name, setName] = useState("Kitchen Booking Funnel");
  const [steps, setSteps] = useState<FunnelStep[]>(DEFAULT_STEPS);
  const [saved, setSaved] = useState(false);

  const updateStep = (id: string, field: keyof FunnelStep, value: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const deleteStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { id: uid(), eventValue: "page_view", eventLabel: "Page View", pagePath: "/" },
    ]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Mock preview data based on step count
  const previewSteps = steps.map((s, i) => ({
    label: s.eventLabel,
    count: Math.round(9420 * Math.pow(0.65, i)),
    dropOff: i > 0 ? 35 : undefined,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Builder panel */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
        <div className="mb-5">
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Funnel Builder</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Define steps to track conversion paths</p>
        </div>

        {/* Funnel name */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] mb-1.5">
            Funnel Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
          />
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-2 mb-2 pl-11">
          <span className="flex-1 text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">Event</span>
          <span className="w-[160px] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">Page Path</span>
          <span className="w-8" />
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-2 mb-4">
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              index={i}
              total={steps.length}
              onChange={updateStep}
              onDelete={deleteStep}
            />
          ))}
        </div>

        {/* Add step */}
        <button
          onClick={addStep}
          disabled={steps.length >= 8}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-9 rounded-[8px]",
            "border border-dashed border-[#3D2E1E] text-[#5A4232]",
            "hover:border-[#C8924A]/40 hover:text-[#C8924A] transition-all",
            "disabled:opacity-40 disabled:pointer-events-none text-[12.5px]"
          )}
        >
          <Plus size={13} />
          Add Step
        </button>

        {/* Save */}
        <div className="mt-4 pt-4 border-t border-[#2E231A] flex justify-end">
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
              saved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-[#C8924A] text-white hover:bg-[#B87E3E]"
            )}
          >
            <Save size={13} />
            {saved ? "Saved!" : "Save Funnel"}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <FunnelChart
        steps={previewSteps}
        title={name || "Untitled Funnel"}
        description="Live preview based on your step configuration"
      />
    </div>
  );
}