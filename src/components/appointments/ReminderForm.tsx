"use client";

import { useState } from "react";
import { Save, Loader2, Bell, Mail, MessageSquare, ChevronDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Channel     = "email" | "sms" | "both";
type Trigger     = "before" | "after";
type OffsetUnit  = "minutes" | "hours" | "days";
type AppType     = "all" | "home_visit" | "showroom" | "online";

const EMAIL_TEMPLATES = [
  "Appointment Confirmation",
  "24h Reminder",
  "2h Reminder",
  "Follow-up — Thank You",
  "Rescheduled Confirmation",
  "Cancellation Confirmation",
];

const SMS_TEMPLATES = [
  "Short Reminder",
  "Day-before SMS",
  "On-the-day SMS",
  "Follow-up SMS",
];

interface ReminderFormProps {
  initialData?: {
    name?: string; channel?: Channel; trigger?: Trigger;
    offsetValue?: number; offsetUnit?: OffsetUnit;
    appliesToType?: AppType; emailTemplate?: string; smsTemplate?: string;
    isActive?: boolean;
  };
  onSave?: (data: any) => void;
  isEdit?: boolean;
}

export function ReminderForm({ initialData, onSave, isEdit = false }: ReminderFormProps) {
  const [name,          setName]    = useState(initialData?.name ?? "");
  const [channel,       setChannel] = useState<Channel>(initialData?.channel ?? "email");
  const [trigger,       setTrigger] = useState<Trigger>(initialData?.trigger ?? "before");
  const [offsetValue,   setOffset]  = useState(initialData?.offsetValue?.toString() ?? "24");
  const [offsetUnit,    setUnit]    = useState<OffsetUnit>(initialData?.offsetUnit ?? "hours");
  const [appType,       setType]    = useState<AppType>(initialData?.appliesToType ?? "all");
  const [emailTpl,      setEmailTpl]= useState(initialData?.emailTemplate ?? EMAIL_TEMPLATES[1]);
  const [smsTpl,        setSmsTpl]  = useState(initialData?.smsTemplate ?? SMS_TEMPLATES[0]);
  const [isActive,      setActive]  = useState(initialData?.isActive ?? true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const handleSubmit = async () => {
    if (!name || !offsetValue) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ name, channel, trigger, offsetValue, offsetUnit, appType, emailTpl, smsTpl, isActive });
    setTimeout(() => setSaved(false), 2000);
  };

  const selectCls = "appearance-none h-10 px-3 pr-8 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  const showEmail = channel === "email" || channel === "both";
  const showSms   = channel === "sms"   || channel === "both";

  // Preview text
  const previewText = `Your appointment is ${trigger === "before" ? "coming up in" : "was"} ${offsetValue} ${offsetUnit}${Number(offsetValue) !== 1 ? "" : ""}${trigger === "before" ? ". Please ensure you're ready." : ". Thank you for meeting with us."}`;

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E231A]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#E8D5B7]">{isEdit ? "Edit Reminder" : "New Reminder Rule"}</h2>
          <p className="text-[12px] text-[#5A4232] mt-0.5">Configure automated notification for appointment events</p>
        </div>
        <button onClick={handleSubmit} disabled={saving || !name}
          className={cn("flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all",
            saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            "disabled:opacity-50 disabled:pointer-events-none")}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">
            Rule Name <span className="text-[#C8924A]">*</span>
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 24h Before — Email Reminder"
            className="w-full h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors" />
        </div>

        {/* Channel */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Channel</label>
          <div className="flex gap-2">
            {([
              { value: "email", label: "Email",     icon: Mail          },
              { value: "sms",   label: "SMS",       icon: MessageSquare },
              { value: "both",  label: "Email + SMS",icon: Bell          },
            ] as { value: Channel; label: string; icon: React.ElementType }[]).map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => setChannel(value)}
                className={cn("flex-1 flex items-center justify-center gap-2 h-10 rounded-[9px] border text-[12.5px] font-medium transition-all",
                  channel === value ? "bg-[#C8924A]/15 border-[#C8924A]/50 text-[#C8924A]"
                  : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/30")}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Timing */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Timing <span className="text-[#C8924A]">*</span></label>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select value={trigger} onChange={(e) => setTrigger(e.target.value as Trigger)} className={cn(selectCls, "w-28")}>
                <option value="before" className="bg-[#1C1611]">Before</option>
                <option value="after"  className="bg-[#1C1611]">After</option>
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>

            <input type="number" min={1} value={offsetValue} onChange={(e) => setOffset(e.target.value)}
              className="w-20 h-10 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors text-center" />

            <div className="relative">
              <select value={offsetUnit} onChange={(e) => setUnit(e.target.value as OffsetUnit)} className={cn(selectCls, "w-28")}>
                <option value="minutes" className="bg-[#1C1611]">Minutes</option>
                <option value="hours"   className="bg-[#1C1611]">Hours</option>
                <option value="days"    className="bg-[#1C1611]">Days</option>
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>

            <span className="text-[12px] text-[#5A4232]">the appointment</span>
          </div>
        </div>

        {/* Applies to */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Applies To</label>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: "all",        label: "All Types"  },
              { value: "home_visit", label: "Home Visit" },
              { value: "showroom",   label: "Showroom"   },
              { value: "online",     label: "Online"     },
            ] as { value: AppType; label: string }[]).map(({ value, label }) => (
              <button key={value} onClick={() => setType(value)}
                className={cn("h-8 px-3 rounded-[8px] border text-[12px] font-medium transition-all",
                  appType === value ? "bg-[#C8924A]/15 border-[#C8924A]/50 text-[#C8924A]"
                  : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/30")}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        {showEmail && (
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">Email Template</label>
            <div className="relative">
              <select value={emailTpl} onChange={(e) => setEmailTpl(e.target.value)} className={cn(selectCls, "w-full")}>
                {EMAIL_TEMPLATES.map((t) => <option key={t} value={t} className="bg-[#1C1611]">{t}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>
          </div>
        )}
        {showSms && (
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-1.5">SMS Template</label>
            <div className="relative">
              <select value={smsTpl} onChange={(e) => setSmsTpl(e.target.value)} className={cn(selectCls, "w-full")}>
                {SMS_TEMPLATES.map((t) => <option key={t} value={t} className="bg-[#1C1611]">{t}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="rounded-[10px] bg-[#2E231A] border border-[#3D2E1E] px-4 py-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2 flex items-center gap-1.5">
            <Eye size={11} /> Message Preview
          </p>
          <p className="text-[12.5px] text-[#7A6045] italic leading-relaxed">"{previewText}"</p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
          <div>
            <p className="text-[13px] font-medium text-[#C8B99A]">Active</p>
            <p className="text-[11px] text-[#3D2E1E]">Enable this reminder rule immediately</p>
          </div>
          <button onClick={() => setActive((v) => !v)}
            className={cn("w-10 h-6 rounded-full border relative transition-all shrink-0",
              isActive ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#1C1611] border-[#3D2E1E]")}>
            <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
              isActive ? "left-[18px]" : "left-0.5")} />
          </button>
        </div>
      </div>
    </div>
  );
}