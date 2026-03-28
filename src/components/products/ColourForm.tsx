"use client";

import { useState, useRef } from "react";

import { Save, Loader2, Pipette } from "lucide-react";

import { cn } from "@/lib/utils";

const PRESET_COLOURS = [
  "#FFFFFF",
  "#F5F0EB",
  "#E8DDD0",
  "#D4C8B8",
  "#C8924A",
  "#8B6B4A",
  "#5E4230",
  "#3D2E1E",
  "#6B7280",
  "#4B5563",
  "#374151",
  "#1F2937",
  "#1E3A5F",
  "#7A9A6B",
  "#E8B4A8",
  "#C8924A",
];

interface ColourFormProps {
  initialData?: { name?: string; hex?: string; isFeatured?: boolean };
  onSave?: (data: { name: string; hex: string; isFeatured: boolean }) => void;
  isEdit?: boolean;
}

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export function ColourForm({ initialData, onSave, isEdit = false }: ColourFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [hex, setHex] = useState(initialData?.hex ?? "#C8924A");
  const [hexInput, setHexInput] = useState(initialData?.hex ?? "#C8924A");
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  const applyHex = (value: string) => {
    const cleaned = value.startsWith("#") ? value : `#${value}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      setHex(cleaned);
      setHexInput(cleaned.toUpperCase());
    }
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    applyHex(value);
  };

  const handleSubmit = async () => {
    if (!name || !hex) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ name, hex, isFeatured });
    setTimeout(() => setSaved(false), 2000);
  };

  const light = isLight(hex);
  const controlClass =
    "h-10 w-full rounded-[9px] border border-[#D8D2C8] bg-[#FCFBF9] px-3 text-[13px] text-[#1A1A18] transition-colors placeholder:text-[#8B8A86] focus:border-[#C8924A]/60 focus:outline-none";

  return (
    <div className="max-w-md overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2E231A] px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Colour" : "New Colour"}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#5A4232]">Define a colour swatch for products</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !name}
          className={cn(
            "flex h-9 items-center gap-2 rounded-[9px] px-4 text-[12.5px] font-medium transition-all",
            saved
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="flex flex-col gap-5 p-6">
        {/* Large preview swatch */}
        <button
          type="button"
          aria-label="Open colour picker"
          className="relative flex h-32 w-full items-end rounded-[12px] p-3 text-left transition-colors duration-300"
          style={{ background: hex }}
          onClick={() => pickerRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && pickerRef.current?.click()}
        >
          <div
            className={`flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium ${light ? "bg-black/15 text-black/70" : "bg-white/15 text-white/90"}`}
          >
            <Pipette size={13} />
            Click to open colour picker
          </div>

          {/* Hidden native picker */}
          <input
            ref={pickerRef}
            type="color"
            value={hex}
            onChange={(e) => {
              setHex(e.target.value);
              setHexInput(e.target.value.toUpperCase());
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-hidden="true"
            tabIndex={-1}
          />
        </button>

        {/* Name */}
        <div>
          <label
            htmlFor="colour-name"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Colour Name <span className="text-[#C8924A]">*</span>
          </label>
          <input
            id="colour-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Natural Oak, Pure White…"
            className={controlClass}
          />
        </div>

        <label className="flex items-center justify-between rounded-[10px] border border-[#3D2E1E] bg-[#2E231A] px-3 py-2.5">
          <div>
            <p className="text-[12px] font-medium text-[#E8D5B7]">Featured colour</p>
            <p className="text-[11px] text-[#8F7B65]">Show this colour in featured lists</p>
          </div>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 accent-[#C8924A]"
          />
        </label>

        {/* Hex code */}
        <div>
          <label
            htmlFor="colour-hex"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]"
          >
            Hex Code <span className="text-[#C8924A]">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div
              className="h-10 w-10 shrink-0 rounded-[9px] border border-[#3D2E1E]"
              style={{ background: hex }}
            />
            <input
              id="colour-hex"
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#C8924A"
              maxLength={7}
              className={`${controlClass} flex-1 font-mono uppercase`}
            />
          </div>
        </div>

        {/* Preset swatches */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8F7B65]">
            Presets
          </p>
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLOURS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setHex(preset);
                  setHexInput(preset.toUpperCase());
                }}
                title={preset}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-all",
                  hex.toLowerCase() === preset.toLowerCase()
                    ? "scale-110 border-[#C8924A] shadow-md shadow-[#C8924A]/30"
                    : "border-[#3D2E1E] hover:scale-105 hover:border-[#C8924A]/50",
                )}
                style={{ background: preset }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
