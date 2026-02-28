"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, Eye, ExternalLink,
  Plus, Trash2, GripVertical, Target, Calendar,
  ChevronDown, TrendingUp, Settings, Palette,
  Type, Image, CheckCircle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LandingStatus  = "live" | "draft" | "paused" | "archived";
type SectionType    = "hero" | "features" | "gallery" | "testimonial" | "cta" | "form" | "stats";
type GoalType       = "form_submit" | "button_click" | "page_view" | "time_on_page";

interface Section {
  id: string;
  type: SectionType;
  label: string;
  enabled: boolean;
  settings: Record<string, string>;
}

interface ConversionGoal {
  id: string;
  type: GoalType;
  label: string;
  target?: string;
}

const SECTION_TYPES: { type: SectionType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "hero",        label: "Hero Section",    icon: Type,   desc: "Main banner with headline & CTA" },
  { type: "features",    label: "Features",        icon: Zap,    desc: "3–4 benefit icons with text"     },
  { type: "gallery",     label: "Image Gallery",   icon: Image,  desc: "Grid of product images"          },
  { type: "testimonial", label: "Testimonials",    icon: Type,   desc: "Customer quotes & ratings"       },
  { type: "cta",         label: "Call to Action",  icon: Target, desc: "Conversion-focused CTA block"    },
  { type: "form",        label: "Lead Form",       icon: Type,   desc: "Enquiry or booking form"         },
  { type: "stats",       label: "Stats Bar",       icon: TrendingUp, desc: "3 headline numbers"         },
];

function uid() { return Math.random().toString(36).slice(2, 8); }

function defaultSettings(type: SectionType): Record<string, string> {
  const map: Record<SectionType, Record<string, string>> = {
    hero:        { heading: "Transform Your Home", subheading: "Premium kitchens & bedrooms, crafted in Britain.", cta: "Book a Free Consultation", image: "", bgColor: "#1C1611" },
    features:    { feature1: "100% British Made", feature2: "5-Year Guarantee", feature3: "Free Design Service", feature4: "Nationwide Installation" },
    gallery:     { caption: "Our latest installations", image1: "", image2: "", image3: "", image4: "" },
    testimonial: { quote1: "", author1: "", quote2: "", author2: "" },
    cta:         { heading: "Ready to Start?", body: "Book your free home visit today.", button: "Book Now", url: "/book" },
    form:        { formTitle: "Get a Free Quote", buttonLabel: "Submit Enquiry", successMessage: "Thank you! We'll be in touch within 24 hours." },
    stats:       { stat1Value: "500+", stat1Label: "Kitchens Installed", stat2Value: "5★", stat2Label: "Average Rating", stat3Value: "10yr", stat3Label: "Experience" },
  };
  return map[type];
}

function SectionCard({ section, onUpdate, onDelete, onToggle }: {
  section: Section;
  onUpdate: (id: string, settings: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(section.type === "hero");

  const inputCls = "w-full h-9 px-3 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  const field = (key: string, placeholder: string) => (
    <div key={key}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1 capitalize">{key.replace(/([A-Z]|\d)/g, " $1").trim()}</label>
      <input value={section.settings[key] ?? ""} onChange={(e) => onUpdate(section.id, { ...section.settings, [key]: e.target.value })}
        placeholder={placeholder} className={inputCls} />
    </div>
  );

  const renderFields = () => {
    switch (section.type) {
      case "hero":        return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{field("heading","Main heading…")}{field("subheading","Subheading…")}{field("cta","CTA button label")}{field("image","Hero image URL")}</div>;
      case "features":    return <div className="grid grid-cols-2 gap-3">{["feature1","feature2","feature3","feature4"].map((k) => field(k, `Feature ${k.slice(-1)}…`))}</div>;
      case "gallery":     return <div className="grid grid-cols-2 gap-3">{field("caption","Gallery caption")}{["image1","image2","image3","image4"].map((k) => field(k, `Image ${k.slice(-1)} URL`))}</div>;
      case "testimonial": return <div className="flex flex-col gap-3">{field("quote1","First quote…")}{field("author1","First author")}{field("quote2","Second quote…")}{field("author2","Second author")}</div>;
      case "cta":         return <div className="flex flex-col gap-3">{field("heading","CTA heading…")}{field("body","Supporting text…")}{field("button","Button label")}{field("url","Destination URL")}</div>;
      case "form":        return <div className="flex flex-col gap-3">{field("formTitle","Form heading…")}{field("buttonLabel","Submit button label")}{field("successMessage","Success message…")}</div>;
      case "stats":       return <div className="grid grid-cols-2 gap-3">{["stat1Value","stat1Label","stat2Value","stat2Label","stat3Value","stat3Label"].map((k) => field(k, k.includes("Value") ? "e.g. 500+" : "e.g. Kitchens Installed"))}</div>;
      default:            return null;
    }
  };

  return (
    <div className={cn("rounded-[12px] border-2 overflow-hidden transition-all",
      section.enabled ? "border-[#2E231A] bg-[#1C1611]" : "border-dashed border-[#2E231A] bg-[#1A100C] opacity-60")}>
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1A100C]">
        <GripVertical size={14} className="text-[#3D2E1E] cursor-grab shrink-0" />
        <button onClick={() => onToggle(section.id)}
          className={cn("w-9 h-5 rounded-full border relative transition-all shrink-0",
            section.enabled ? "bg-[#C8924A] border-[#C8924A]" : "bg-[#2E231A] border-[#3D2E1E]")}>
          <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
            section.enabled ? "left-[17px]" : "left-0.5")} />
        </button>
        <span className="flex-1 text-[12.5px] font-semibold text-[#C8B99A]">{section.label}</span>
        <button onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-[#5A4232] hover:text-[#C8924A] transition-colors">
          {expanded ? "Collapse" : "Edit"}
        </button>
        <button onClick={() => onDelete(section.id)}
          className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[#3D2E1E] hover:text-red-400 hover:bg-red-400/10 transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && section.enabled && (
        <div className="p-4 border-t border-[#2E231A] flex flex-col gap-3">
          {renderFields()}
        </div>
      )}
    </div>
  );
}

interface LandingPageEditorProps { pageId?: string; isEdit?: boolean; }

export function LandingPageEditor({ pageId, isEdit = false }: LandingPageEditorProps) {
  const [title,      setTitle]      = useState(isEdit ? "Spring Kitchen Sale 2026" : "");
  const [slug,       setSlug]       = useState(isEdit ? "/kitchen-spring-sale" : "/");
  const [campaign,   setCampaign]   = useState(isEdit ? "Spring Sale" : "");
  const [status,     setStatus]     = useState<LandingStatus>("draft");
  const [expiresAt,  setExpires]    = useState(isEdit ? "2026-03-31" : "");
  const [sections,   setSections]   = useState<Section[]>(
    isEdit ? [
      { id: "s1", type: "hero",     label: "Hero Section",   enabled: true,  settings: defaultSettings("hero")     },
      { id: "s2", type: "features", label: "Features",       enabled: true,  settings: defaultSettings("features") },
      { id: "s3", type: "gallery",  label: "Image Gallery",  enabled: true,  settings: defaultSettings("gallery")  },
      { id: "s4", type: "cta",      label: "Call to Action", enabled: true,  settings: defaultSettings("cta")      },
      { id: "s5", type: "form",     label: "Lead Form",      enabled: true,  settings: defaultSettings("form")     },
    ] : []
  );
  const [goals,      setGoals]      = useState<ConversionGoal[]>([
    { id: "g1", type: "form_submit",  label: "Form submission" },
    { id: "g2", type: "button_click", label: "CTA button click", target: "#cta" },
  ]);
  const [showSectionPicker, setShowPicker] = useState(false);
  const [activeTab,  setTab]        = useState<"sections"|"goals"|"settings">("sections");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const addSection = (type: SectionType, label: string) => {
    setSections((p) => [...p, { id: uid(), type, label, enabled: true, settings: defaultSettings(type) }]);
    setShowPicker(false);
  };

  const updateSection = (id: string, settings: Record<string, string>) =>
    setSections((p) => p.map((s) => s.id === id ? { ...s, settings } : s));
  const deleteSection = (id: string) =>
    setSections((p) => p.filter((s) => s.id !== id));
  const toggleSection = (id: string) =>
    setSections((p) => p.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));

  const removeGoal = (id: string) => setGoals((p) => p.filter((g) => g.id !== id));

  const handleSave = async (s: LandingStatus = status) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setStatus(s);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const selectCls = "appearance-none w-full h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors";
  const inputCls  = "w-full h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  const TABS = [
    { id: "sections", label: "Sections",    icon: Palette  },
    { id: "goals",    label: "Goals",       icon: Target   },
    { id: "settings", label: "Settings",    icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/content/landing"
            className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-[17px] font-bold text-[#E8D5B7]">{isEdit ? "Edit Landing Page" : "New Landing Page"}</h1>
            <p className="text-[11.5px] font-mono text-[#5A4232] mt-0.5">{slug || "/"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all">
            <Eye size={13} /> Preview
          </button>
          <button onClick={() => handleSave("draft")} disabled={saving}
            className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all disabled:opacity-50">
            <Save size={13} /> Save Draft
          </button>
          <button onClick={() => handleSave("live")} disabled={saving || !title}
            className={cn("flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all disabled:opacity-50",
              saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]")}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            {saved ? "Live!" : saving ? "Saving…" : "Go Live"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main: tabbed editor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Title + slug */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <input value={title}
              onChange={(e) => { setTitle(e.target.value); if (!isEdit) setSlug("/" + e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }}
              placeholder="Landing page title…"
              className="w-full bg-transparent text-[20px] font-bold text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none border-b border-[#2E231A] pb-3 mb-3" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#3D2E1E] font-mono shrink-0">lomashwood.co.uk</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent text-[11.5px] font-mono text-[#5A4232] focus:outline-none focus:text-[#C8924A] transition-colors" />
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
            <div className="flex border-b border-[#2E231A]">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn("flex items-center gap-1.5 px-5 py-3 text-[12px] font-medium transition-all",
                    activeTab === id
                      ? "text-[#C8924A] border-b-2 border-[#C8924A] -mb-px"
                      : "text-[#5A4232] hover:text-[#C8924A]")}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-3">
              {/* Sections tab */}
              {activeTab === "sections" && (
                <>
                  {sections.length === 0 && (
                    <div className="rounded-[12px] border-2 border-dashed border-[#2E231A] py-10 flex flex-col items-center gap-2 text-center">
                      <Palette size={24} className="text-[#3D2E1E]" />
                      <p className="text-[13px] text-[#5A4232]">No sections yet — add your first below</p>
                    </div>
                  )}
                  {sections.map((section) => (
                    <SectionCard key={section.id} section={section}
                      onUpdate={updateSection} onDelete={deleteSection} onToggle={toggleSection} />
                  ))}

                  {/* Add section */}
                  <div className="relative">
                    <button onClick={() => setShowPicker((v) => !v)}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-[12px] border-2 border-dashed border-[#3D2E1E] text-[12.5px] text-[#5A4232] hover:border-[#C8924A]/50 hover:text-[#C8924A] hover:bg-[#221A12] transition-all">
                      <Plus size={15} /> Add Section
                    </button>
                    {showPicker && (
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-20 bg-[#1C1611] border border-[#2E231A] rounded-[14px] shadow-2xl p-4">
                        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-3">Add a section</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {SECTION_TYPES.map(({ type, label, icon: Icon, desc }) => (
                            <button key={type} onClick={() => addSection(type, label)}
                              className="flex flex-col items-start gap-1.5 p-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E] hover:border-[#C8924A]/40 hover:bg-[#221A12] text-left transition-all group/btn">
                              <div className="w-8 h-8 rounded-[8px] bg-[#C8924A]/15 flex items-center justify-center group-hover/btn:bg-[#C8924A] transition-all">
                                <Icon size={14} className="text-[#C8924A] group-hover/btn:text-white transition-colors" />
                              </div>
                              <p className="text-[11.5px] font-semibold text-[#C8B99A]">{label}</p>
                              <p className="text-[10px] text-[#3D2E1E] leading-tight">{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Goals tab */}
              {activeTab === "goals" && (
                <>
                  <p className="text-[12px] text-[#5A4232] mb-1">Define what counts as a conversion on this page.</p>
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[12.5px] font-medium text-[#C8B99A]">{goal.label}</p>
                        <p className="text-[11px] text-[#5A4232] capitalize">{goal.type.replace("_"," ")}
                          {goal.target && <span> · <span className="font-mono">{goal.target}</span></span>}
                        </p>
                      </div>
                      <button onClick={() => removeGoal(goal.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setGoals((p) => [...p, { id: uid(), type: "form_submit", label: "New goal" }])}
                    className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-dashed border-[#3D2E1E] text-[12px] text-[#5A4232] hover:text-[#C8924A] hover:border-[#C8924A]/40 transition-all">
                    <Plus size={13} /> Add goal
                  </button>
                </>
              )}

              {/* Settings tab */}
              {activeTab === "settings" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Campaign Name</label>
                    <input value={campaign} onChange={(e) => setCampaign(e.target.value)}
                      placeholder="e.g. Spring Sale 2026" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Expiry Date</label>
                    <div className="relative">
                      <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
                      <input type="date" value={expiresAt} onChange={(e) => setExpires(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors" />
                    </div>
                    <p className="text-[11px] text-[#3D2E1E] mt-1">Page will auto-archive after this date</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Publish */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-4">Publish</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Status</label>
                <div className="relative">
                  <select value={status} onChange={(e) => setStatus(e.target.value as LandingStatus)} className={selectCls}>
                    <option value="draft"    className="bg-[#1C1611]">Draft</option>
                    <option value="live"     className="bg-[#1C1611]">Live</option>
                    <option value="paused"   className="bg-[#1C1611]">Paused</option>
                    <option value="archived" className="bg-[#1C1611]">Archived</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section summary */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-3">Sections ({sections.length})</h3>
            {sections.length === 0
              ? <p className="text-[12px] text-[#3D2E1E] italic">No sections</p>
              : sections.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 mb-1.5 last:mb-0 text-[12px]">
                  <span className="text-[10px] text-[#3D2E1E] w-4">{i + 1}.</span>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.enabled ? "bg-emerald-400" : "bg-[#5A4232]")} />
                  <span className={s.enabled ? "text-[#7A6045]" : "text-[#3D2E1E] line-through"}>{s.label}</span>
                </div>
              ))
            }
          </div>

          {/* Goals summary */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-3 flex items-center gap-2">
              <Target size={13} className="text-[#C8924A]" />
              Conv. Goals ({goals.length})
            </h3>
            {goals.map((g) => (
              <p key={g.id} className="text-[12px] text-[#7A6045] mb-1">{g.label}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}