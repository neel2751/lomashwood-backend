"use client";

import { useState } from "react";

import { Save, Loader2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

type ConsultantStatus = "active" | "inactive" | "on_leave";
type Specialisation   = "Kitchen" | "Bedroom" | "Both";
type ApptType         = "home_visit" | "showroom" | "online";

interface ConsultantFormProps {
  initialData?: {
    name?: string; email?: string; phone?: string; bio?: string;
    specialisation?: Specialisation[]; types?: ApptType[];
    status?: ConsultantStatus; maxPerDay?: number;
  };
  onSave?: (data: any) => void;
  isEdit?: boolean;
}

const TYPE_OPTIONS: { value: ApptType; label: string }[] = [
  { value: "home_visit", label: "Home Visit"  },
  { value: "showroom",   label: "Showroom"    },
  { value: "online",     label: "Online"      },
];

const SPEC_OPTIONS: Specialisation[] = ["Kitchen", "Bedroom", "Both"];

export function ConsultantForm({ initialData, onSave, isEdit = false }: ConsultantFormProps) {
  const [name,           setName]   = useState(initialData?.name ?? "");
  const [email,          setEmail]  = useState(initialData?.email ?? "");
  const [phone,          setPhone]  = useState(initialData?.phone ?? "");
  const [bio,            setBio]    = useState(initialData?.bio ?? "");
  const [specs, setSpecs]           = useState<Specialisation[]>(initialData?.specialisation ?? ["Kitchen"]);
  const [types, setTypes]           = useState<ApptType[]>(initialData?.types ?? ["showroom","online"]);
  const [status,         setStatus] = useState<ConsultantStatus>(initialData?.status ?? "active");
  const [maxPerDay,      setMax]    = useState(initialData?.maxPerDay?.toString() ?? "6");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const toggleSpec = (s: Specialisation) =>
    setSpecs((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleType = (t: ApptType) =>
    setTypes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const handleSubmit = async () => {
    if (!name || !email) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ name, email, phone, bio, specs, types, status, maxPerDay });
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">{isEdit ? "Edit Consultant" : "New Consultant"}</h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Design consultant profile and availability settings</p>
        </div>
        <button onClick={handleSubmit} disabled={saving || !name || !email}
          className={cn("flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:opacity-50 disabled:pointer-events-none")}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#2E231A]">
        {/* Main */}
        <div className="lg:col-span-2 p-6 flex flex-col gap-5">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] flex items-center justify-center text-white text-[20px] font-bold shrink-0">
              {name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "?"}
            </div>
            <button className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
              <Upload size={13} /> Upload Photo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Full Name <span className="text-[#C8924A]">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Alderton" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 …" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Work Email <span className="text-[#C8924A]">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@lomashwood.co.uk" className={inputCls} />
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Bio / Notes</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder="Brief bio or internal notes about this consultant…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none" />
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="p-6 flex flex-col gap-5">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Status</label>
            <div className="flex flex-col gap-1.5">
              {([
                { value: "active",   label: "Active",   color: "text-emerald-400" },
                { value: "on_leave", label: "On Leave", color: "text-amber-400"   },
                { value: "inactive", label: "Inactive", color: "text-[#5A4232]"   },
              ] as { value: ConsultantStatus; label: string; color: string }[]).map(({ value, label, color }) => (
                <button key={value} onClick={() => setStatus(value)}
                  className={cn("flex items-center gap-2 h-9 px-3 rounded-[9px] border text-[12.5px] transition-all text-left",
                    status === value ? "border-[#C8924A]/50 bg-[#C8924A]/10 " + color : "border-[#3D2E1E] bg-[#2E231A] text-[#5A4232] hover:border-[#C8924A]/30")}>
                  <span className={cn("w-2 h-2 rounded-full shrink-0",
                    value === "active" ? "bg-emerald-400" : value === "on_leave" ? "bg-amber-400" : "bg-[#5A4232]")} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Specialisation */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Specialisation</label>
            <div className="flex flex-col gap-1.5">
              {SPEC_OPTIONS.map((s) => (
                <button key={s} onClick={() => toggleSpec(s)}
                  className={cn("flex items-center gap-2 h-9 px-3 rounded-[9px] border text-[12.5px] transition-all",
                    specs.includes(s) ? "border-[#C8924A]/50 bg-[#C8924A]/10 text-[#C8924A]" : "border-[#3D2E1E] bg-[#2E231A] text-[#5A4232] hover:border-[#C8924A]/30")}>
                  {specs.includes(s) && <span className="w-1.5 h-1.5 rounded-full bg-[#C8924A] shrink-0" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Appointment types */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Appointment Types</label>
            <div className="flex flex-col gap-1.5">
              {TYPE_OPTIONS.map(({ value, label }) => (
                <button key={value} onClick={() => toggleType(value)}
                  className={cn("flex items-center gap-2 h-9 px-3 rounded-[9px] border text-[12.5px] transition-all",
                    types.includes(value) ? "border-[#C8924A]/50 bg-[#C8924A]/10 text-[#C8924A]" : "border-[#3D2E1E] bg-[#2E231A] text-[#5A4232] hover:border-[#C8924A]/30")}>
                  {types.includes(value) && <span className="w-1.5 h-1.5 rounded-full bg-[#C8924A] shrink-0" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max appointments per day */}
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Max Appts / Day</label>
            <input type="number" min={1} max={20} value={maxPerDay}
              onChange={(e) => setMax(e.target.value)}
              className={inputCls} />
          </div>
        </div>
      </div>
    </div>
  );
}