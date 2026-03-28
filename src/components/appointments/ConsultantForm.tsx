"use client";

import { useState } from "react";

import { Save, Loader2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

type ConsultantStatus = "active" | "inactive" | "on_leave";
type Specialisation = "Kitchen" | "Bedroom" | "Both";
type ApptType = "home_visit" | "showroom" | "online";

interface ConsultantFormProps {
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    specialisation?: Specialisation[];
    types?: ApptType[];
    status?: ConsultantStatus;
    maxPerDay?: number;
  };
  onSave?: (data: any) => void;
  isEdit?: boolean;
}

const TYPE_OPTIONS: { value: ApptType; label: string }[] = [
  { value: "home_visit", label: "Home Visit" },
  { value: "showroom", label: "Showroom" },
  { value: "online", label: "Online" },
];

const SPEC_OPTIONS: Specialisation[] = ["Kitchen", "Bedroom", "Both"];

export function ConsultantForm({ initialData, onSave, isEdit = false }: ConsultantFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [specs, setSpecs] = useState<Specialisation[]>(initialData?.specialisation ?? ["Kitchen"]);
  const [types, setTypes] = useState<ApptType[]>(initialData?.types ?? ["showroom", "online"]);
  const [status, setStatus] = useState<ConsultantStatus>(initialData?.status ?? "active");
  const [maxPerDay, setMax] = useState(initialData?.maxPerDay?.toString() ?? "6");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSpec = (s: Specialisation) =>
    setSpecs((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const toggleType = (t: ApptType) =>
    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const handleSubmit = async () => {
    if (!name || !email) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ name, email, phone, bio, specs, types, status, maxPerDay });
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls =
    "h-10 w-full rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[13px] text-[#2B2A28] placeholder:text-[#8A877F] focus:border-[#C8924A]/50 focus:outline-none transition-colors";

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E6E1] bg-[#FCFBF9] px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1A1A18]">
            {isEdit ? "Edit Consultant" : "New Consultant"}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#6B6B68]">
            Design consultant profile and availability settings
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !name || !email}
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

      <div className="grid grid-cols-1 gap-0 divide-y divide-[#E8E6E1] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Main */}
        <div className="flex flex-col gap-5 p-6 lg:col-span-2">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] text-[20px] font-bold text-white">
              {name
                ? name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                : "?"}
            </div>
            <button className="flex h-9 items-center gap-2 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12px] text-[#6B6B68] transition-all hover:border-[#C8924A]/30 hover:text-[#C8924A]">
              <Upload size={13} /> Upload Photo
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
                Full Name <span className="text-[#C8924A]">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Alderton"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7700 …"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
              Work Email <span className="text-[#C8924A]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@lomashwood.co.uk"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
              Bio / Notes
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Brief bio or internal notes about this consultant…"
              className="w-full resize-none rounded-[9px] border border-[#D9D5CD] bg-white px-3 py-2.5 text-[13px] text-[#2B2A28] transition-colors placeholder:text-[#8A877F] focus:border-[#C8924A]/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="flex flex-col gap-5 p-6">
          {/* Status */}
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
              Status
            </label>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  { value: "active", label: "Active", color: "text-emerald-400" },
                  { value: "on_leave", label: "On Leave", color: "text-amber-400" },
                  { value: "inactive", label: "Inactive", color: "text-[#6B6B68]" },
                ] as { value: ConsultantStatus; label: string; color: string }[]
              ).map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-[9px] border px-3 text-left text-[12.5px] transition-all",
                    status === value
                      ? "border-[#C8924A]/50 bg-[#C8924A]/10 " + color
                      : "border-[#D9D5CD] bg-white text-[#6B6B68] hover:border-[#C8924A]/30",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      value === "active"
                        ? "bg-emerald-400"
                        : value === "on_leave"
                          ? "bg-amber-400"
                          : "bg-[#8B8A86]",
                    )}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Specialisation */}
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
              Specialisation
            </label>
            <div className="flex flex-col gap-1.5">
              {SPEC_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSpec(s)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-[9px] border px-3 text-[12.5px] transition-all",
                    specs.includes(s)
                      ? "border-[#C8924A]/50 bg-[#C8924A]/10 text-[#C8924A]"
                      : "border-[#D9D5CD] bg-white text-[#6B6B68] hover:border-[#C8924A]/30",
                  )}
                >
                  {specs.includes(s) && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8924A]" />
                  )}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Appointment types */}
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
              Appointment Types
            </label>
            <div className="flex flex-col gap-1.5">
              {TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleType(value)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-[9px] border px-3 text-[12.5px] transition-all",
                    types.includes(value)
                      ? "border-[#C8924A]/50 bg-[#C8924A]/10 text-[#C8924A]"
                      : "border-[#D9D5CD] bg-white text-[#6B6B68] hover:border-[#C8924A]/30",
                  )}
                >
                  {types.includes(value) && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8924A]" />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max appointments per day */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
              Max Appts / Day
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxPerDay}
              onChange={(e) => setMax(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
