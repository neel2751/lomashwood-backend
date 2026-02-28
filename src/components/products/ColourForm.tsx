"use client";

import { useState, useRef } from "react";
import { Save, Loader2, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLOURS = [
  "#FFFFFF","#F5F0EB","#E8DDD0","#D4C8B8",
  "#C8924A","#8B6B4A","#5E4230","#3D2E1E",
  "#6B7280","#4B5563","#374151","#1F2937",
  "#1E3A5F","#7A9A6B","#E8B4A8","#C8924A",
];

interface ColourFormProps {
  initialData?: { name?: string; hex?: string };
  onSave?: (data: { name: string; hex: string }) => void;
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
    onSave?.({ name, hex });
    setTimeout(() => setSaved(false), 2000);
  };

  const light = isLight(hex);

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">
            {isEdit ? "Edit Colour" : "New Colour"}
          </h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Define a colour swatch for products</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !name}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Large preview swatch */}
        <div
          className="relative h-32 rounded-[12px] flex items-end p-3 transition-colors duration-300 cursor-pointer"
          style={{ background: hex }}
          onClick={() => pickerRef.current?.click()}
        >
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium ${light ? "bg-black/15 text-black/70" : "bg-white/15 text-white/90"}`}>
            <Pipette size={13} />
            Click to open colour picker
          </div>

          {/* Hidden native picker */}
          <input
            ref={pickerRef}
            type="color"
            value={hex}
            onChange={(e) => { setHex(e.target.value); setHexInput(e.target.value.toUpperCase()); }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Colour Name <span className="text-[#C8924A]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Natural Oak, Pure White…"
            className="w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors"
          />
        </div>

        {/* Hex code */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Hex Code <span className="text-[#C8924A]">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-[9px] border border-[#3D2E1E] shrink-0" style={{ background: hex }} />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#C8924A"
              maxLength={7}
              className="flex-1 h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] font-mono text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors uppercase"
            />
          </div>
        </div>

        {/* Preset swatches */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">
            Presets
          </label>
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLOURS.map((preset) => (
              <button
                key={preset}
                onClick={() => { setHex(preset); setHexInput(preset.toUpperCase()); }}
                title={preset}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  hex.toLowerCase() === preset.toLowerCase()
                    ? "border-[#C8924A] scale-110 shadow-md shadow-[#C8924A]/30"
                    : "border-[#3D2E1E] hover:border-[#C8924A]/50 hover:scale-105"
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