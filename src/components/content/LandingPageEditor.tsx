"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  ExternalLink,
  Plus,
  Trash2,
  GripVertical,
  Target,
  Calendar,
  ChevronDown,
  TrendingUp,
  Settings,
  Palette,
  Type,
  Image,
  CheckCircle,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

type LandingStatus = "live" | "draft" | "paused" | "archived";
type SectionType = "hero" | "features" | "gallery" | "testimonial" | "cta" | "form" | "stats";
type GoalType = "form_submit" | "button_click" | "page_view" | "time_on_page";

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

const SECTION_TYPES: { type: SectionType; label: string; icon: React.ElementType; desc: string }[] =
  [
    { type: "hero", label: "Hero Section", icon: Type, desc: "Main banner with headline & CTA" },
    { type: "features", label: "Features", icon: Zap, desc: "3–4 benefit icons with text" },
    { type: "gallery", label: "Image Gallery", icon: Image, desc: "Grid of product images" },
    { type: "testimonial", label: "Testimonials", icon: Type, desc: "Customer quotes & ratings" },
    { type: "cta", label: "Call to Action", icon: Target, desc: "Conversion-focused CTA block" },
    { type: "form", label: "Lead Form", icon: Type, desc: "Enquiry or booking form" },
    { type: "stats", label: "Stats Bar", icon: TrendingUp, desc: "3 headline numbers" },
  ];

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function defaultSettings(type: SectionType): Record<string, string> {
  const map: Record<SectionType, Record<string, string>> = {
    hero: {
      heading: "Transform Your Home",
      subheading: "Premium kitchens & bedrooms, crafted in Britain.",
      cta: "Book a Free Consultation",
      image: "",
      bgColor: "#1C1611",
    },
    features: {
      feature1: "100% British Made",
      feature2: "5-Year Guarantee",
      feature3: "Free Design Service",
      feature4: "Nationwide Installation",
    },
    gallery: {
      caption: "Our latest installations",
      image1: "",
      image2: "",
      image3: "",
      image4: "",
    },
    testimonial: { quote1: "", author1: "", quote2: "", author2: "" },
    cta: {
      heading: "Ready to Start?",
      body: "Book your free home visit today.",
      button: "Book Now",
      url: "/book",
    },
    form: {
      formTitle: "Get a Free Quote",
      buttonLabel: "Submit Enquiry",
      successMessage: "Thank you! We'll be in touch within 24 hours.",
    },
    stats: {
      stat1Value: "500+",
      stat1Label: "Kitchens Installed",
      stat2Value: "5★",
      stat2Label: "Average Rating",
      stat3Value: "10yr",
      stat3Label: "Experience",
    },
  };
  return map[type];
}

function SectionCard({
  section,
  onUpdate,
  onDelete,
  onToggle,
}: {
  section: Section;
  onUpdate: (id: string, settings: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(section.type === "hero");

  const inputCls =
    "w-full h-9 rounded-[8px] border border-[#D9D5CD] bg-white px-3 text-[12.5px] text-[#2B2A28] placeholder:text-[#8A877F] focus:border-[#C8924A]/50 focus:outline-none transition-colors";

  const field = (key: string, placeholder: string) => (
    <div key={key}>
      <label
        htmlFor={`${section.id}-${key}`}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E]"
      >
        {key.replace(/([A-Z]|\d)/g, " $1").trim()}
      </label>
      <input
        id={`${section.id}-${key}`}
        value={section.settings[key] ?? ""}
        onChange={(e) => onUpdate(section.id, { ...section.settings, [key]: e.target.value })}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );

  const renderFields = () => {
    switch (section.type) {
      case "hero":
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {field("heading", "Main heading…")}
            {field("subheading", "Subheading…")}
            {field("cta", "CTA button label")}
            {field("image", "Hero image URL")}
          </div>
        );
      case "features":
        return (
          <div className="grid grid-cols-2 gap-3">
            {["feature1", "feature2", "feature3", "feature4"].map((k) =>
              field(k, `Feature ${k.slice(-1)}…`),
            )}
          </div>
        );
      case "gallery":
        return (
          <div className="grid grid-cols-2 gap-3">
            {field("caption", "Gallery caption")}
            {["image1", "image2", "image3", "image4"].map((k) =>
              field(k, `Image ${k.slice(-1)} URL`),
            )}
          </div>
        );
      case "testimonial":
        return (
          <div className="flex flex-col gap-3">
            {field("quote1", "First quote…")}
            {field("author1", "First author")}
            {field("quote2", "Second quote…")}
            {field("author2", "Second author")}
          </div>
        );
      case "cta":
        return (
          <div className="flex flex-col gap-3">
            {field("heading", "CTA heading…")}
            {field("body", "Supporting text…")}
            {field("button", "Button label")}
            {field("url", "Destination URL")}
          </div>
        );
      case "form":
        return (
          <div className="flex flex-col gap-3">
            {field("formTitle", "Form heading…")}
            {field("buttonLabel", "Submit button label")}
            {field("successMessage", "Success message…")}
          </div>
        );
      case "stats":
        return (
          <div className="grid grid-cols-2 gap-3">
            {[
              "stat1Value",
              "stat1Label",
              "stat2Value",
              "stat2Label",
              "stat3Value",
              "stat3Label",
            ].map((k) => field(k, k.includes("Value") ? "e.g. 500+" : "e.g. Kitchens Installed"))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[12px] border-2 transition-all",
        section.enabled
          ? "border-[#E8E6E1] bg-white"
          : "border-dashed border-[#E8E6E1] bg-[#FCFBF9] opacity-75",
      )}
    >
      <div className="flex items-center gap-3 bg-[#FCFBF9] px-4 py-3">
        <GripVertical size={14} className="shrink-0 cursor-grab text-[#8B8A86]" />
        <button
          onClick={() => onToggle(section.id)}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full border transition-all",
            section.enabled ? "border-[#C8924A] bg-[#C8924A]" : "border-[#D9D5CD] bg-white",
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
              section.enabled ? "left-[17px]" : "left-0.5",
            )}
          />
        </button>
        <span className="flex-1 text-[12.5px] font-semibold text-[#1A1A18]">{section.label}</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-[#6B6B68] transition-colors hover:text-[#C8924A]"
        >
          {expanded ? "Collapse" : "Edit"}
        </button>
        <button
          onClick={() => onDelete(section.id)}
          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-[#8B8A86] transition-all hover:bg-red-400/10 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && section.enabled && (
        <div className="flex flex-col gap-3 border-t border-[#E8E6E1] p-4">{renderFields()}</div>
      )}
    </div>
  );
}

interface LandingPageEditorProps {
  isEdit?: boolean;
}

export function LandingPageEditor({ isEdit = false }: LandingPageEditorProps) {
  const [title, setTitle] = useState(isEdit ? "Spring Kitchen Sale 2026" : "");
  const [slug, setSlug] = useState(isEdit ? "/kitchen-spring-sale" : "/");
  const [campaign, setCampaign] = useState(isEdit ? "Spring Sale" : "");
  const [status, setStatus] = useState<LandingStatus>("draft");
  const [expiresAt, setExpires] = useState(isEdit ? "2026-03-31" : "");
  const [sections, setSections] = useState<Section[]>(
    isEdit
      ? [
          {
            id: "s1",
            type: "hero",
            label: "Hero Section",
            enabled: true,
            settings: defaultSettings("hero"),
          },
          {
            id: "s2",
            type: "features",
            label: "Features",
            enabled: true,
            settings: defaultSettings("features"),
          },
          {
            id: "s3",
            type: "gallery",
            label: "Image Gallery",
            enabled: true,
            settings: defaultSettings("gallery"),
          },
          {
            id: "s4",
            type: "cta",
            label: "Call to Action",
            enabled: true,
            settings: defaultSettings("cta"),
          },
          {
            id: "s5",
            type: "form",
            label: "Lead Form",
            enabled: true,
            settings: defaultSettings("form"),
          },
        ]
      : [],
  );
  const [goals, setGoals] = useState<ConversionGoal[]>([
    { id: "g1", type: "form_submit", label: "Form submission" },
    { id: "g2", type: "button_click", label: "CTA button click", target: "#cta" },
  ]);
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setTab] = useState<"sections" | "goals" | "settings">("sections");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addSection = (type: SectionType, label: string) => {
    setSections((p) => [
      ...p,
      { id: uid(), type, label, enabled: true, settings: defaultSettings(type) },
    ]);
    setShowPicker(false);
  };

  const updateSection = (id: string, settings: Record<string, string>) =>
    setSections((p) => p.map((s) => (s.id === id ? { ...s, settings } : s)));
  const deleteSection = (id: string) => setSections((p) => p.filter((s) => s.id !== id));
  const toggleSection = (id: string) =>
    setSections((p) => p.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));

  const removeGoal = (id: string) => setGoals((p) => p.filter((g) => g.id !== id));

  const handleSave = async (s: LandingStatus = status) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setStatus(s);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const selectCls =
    "appearance-none w-full h-9 rounded-[9px] border border-[#D9D5CD] bg-white px-3 pr-7 text-[12.5px] text-[#2B2A28] focus:border-[#C8924A]/50 focus:outline-none transition-colors";
  const inputCls =
    "w-full h-9 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12.5px] text-[#2B2A28] placeholder:text-[#8A877F] focus:border-[#C8924A]/50 focus:outline-none transition-colors";

  const TABS = [
    { id: "sections", label: "Sections", icon: Palette },
    { id: "goals", label: "Goals", icon: Target },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/content/landing"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#D9D5CD] bg-white text-[#8B8A86] transition-colors hover:text-[#C8924A]"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-[17px] font-bold text-[#1A1A18]">
              {isEdit ? "Edit Landing Page" : "New Landing Page"}
            </h1>
            <p className="mt-0.5 font-mono text-[11.5px] text-[#6B6B68]">{slug || "/"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12px] text-[#6B6B68] transition-all hover:border-[#C8924A]/30 hover:text-[#C8924A]">
            <Eye size={13} /> Preview
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12px] text-[#6B6B68] transition-all hover:border-[#C8924A]/30 hover:text-[#C8924A] disabled:opacity-50"
          >
            <Save size={13} /> Save Draft
          </button>
          <button
            onClick={() => handleSave("live")}
            disabled={saving || !title}
            className={cn(
              "flex h-9 items-center gap-2 rounded-[9px] px-4 text-[12.5px] font-medium transition-all disabled:opacity-50",
              saved
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            {saved ? "Live!" : saving ? "Saving…" : "Go Live"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit)
                  setSlug("/" + e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              placeholder="Landing page title…"
              className="mb-3 w-full border-b border-[#E8E6E1] bg-transparent pb-3 text-[20px] font-bold text-[#1A1A18] placeholder:text-[#8A877F] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-mono text-[11px] text-[#8A877F]">
                lomashwood.co.uk
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent font-mono text-[11.5px] text-[#6B6B68] transition-colors focus:text-[#C8924A] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white">
            <div className="flex border-b border-[#E8E6E1] bg-[#FCFBF9]">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-5 py-3 text-[12px] font-medium transition-all",
                    activeTab === id
                      ? "-mb-px border-b-2 border-[#C8924A] text-[#C8924A]"
                      : "text-[#6B6B68] hover:text-[#C8924A]",
                  )}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 p-5">
              {activeTab === "sections" && (
                <>
                  {sections.length === 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-[12px] border-2 border-dashed border-[#D9D5CD] py-10 text-center">
                      <Palette size={24} className="text-[#8B8A86]" />
                      <p className="text-[13px] text-[#6B6B68]">
                        No sections yet — add your first below
                      </p>
                    </div>
                  )}
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      onUpdate={updateSection}
                      onDelete={deleteSection}
                      onToggle={toggleSection}
                    />
                  ))}

                  <div className="relative">
                    <button
                      onClick={() => setShowPicker((v) => !v)}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[#D9D5CD] text-[12.5px] text-[#6B6B68] transition-all hover:border-[#C8924A]/50 hover:bg-[#FCFBF9] hover:text-[#C8924A]"
                    >
                      <Plus size={15} /> Add Section
                    </button>
                    {showPicker && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[14px] border border-[#E8E6E1] bg-white p-4 shadow-2xl">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]">
                          Add a section
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {SECTION_TYPES.map(({ type, label, icon: Icon, desc }) => (
                            <button
                              key={type}
                              onClick={() => addSection(type, label)}
                              className="group/btn flex flex-col items-start gap-1.5 rounded-[10px] border border-[#E8E6E1] bg-[#FCFBF9] p-3 text-left transition-all hover:border-[#C8924A]/40 hover:bg-white"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#C8924A]/15 transition-all group-hover/btn:bg-[#C8924A]">
                                <Icon
                                  size={14}
                                  className="text-[#C8924A] transition-colors group-hover/btn:text-white"
                                />
                              </div>
                              <p className="text-[11.5px] font-semibold text-[#1A1A18]">{label}</p>
                              <p className="text-[10px] leading-tight text-[#6B6B68]">{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "goals" && (
                <>
                  <p className="mb-1 text-[12px] text-[#6B6B68]">
                    Define what counts as a conversion on this page.
                  </p>
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-3 rounded-[10px] border border-[#E8E6E1] bg-[#FCFBF9] px-4 py-3"
                    >
                      <CheckCircle size={14} className="shrink-0 text-emerald-400" />
                      <div className="flex-1">
                        <p className="text-[12.5px] font-medium text-[#1A1A18]">{goal.label}</p>
                        <p className="text-[11px] capitalize text-[#6B6B68]">
                          {goal.type.replace("_", " ")}
                          {goal.target && (
                            <span>
                              {" "}
                              · <span className="font-mono">{goal.target}</span>
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-red-400/10 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setGoals((p) => [...p, { id: uid(), type: "form_submit", label: "New goal" }])
                    }
                    className="flex h-9 items-center gap-2 rounded-[9px] border border-dashed border-[#D9D5CD] bg-white px-3 text-[12px] text-[#6B6B68] transition-all hover:border-[#C8924A]/40 hover:text-[#C8924A]"
                  >
                    <Plus size={13} /> Add goal
                  </button>
                </>
              )}

              {activeTab === "settings" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor="campaign-name"
                      className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                    >
                      Campaign Name
                    </label>
                    <input
                      id="campaign-name"
                      value={campaign}
                      onChange={(e) => setCampaign(e.target.value)}
                      placeholder="e.g. Spring Sale 2026"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="expiry-date"
                      className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                    >
                      Expiry Date
                    </label>
                    <div className="relative">
                      <Calendar
                        size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8A86]"
                      />
                      <input
                        id="expiry-date"
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpires(e.target.value)}
                        className="h-9 w-full rounded-[9px] border border-[#D9D5CD] bg-white pl-8 pr-3 text-[12.5px] text-[#2B2A28] transition-colors focus:border-[#C8924A]/50 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#8A877F]">
                      Page will auto-archive after this date
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-[#1A1A18]">Publish</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="landing-status"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Status
                </label>
                <div className="relative">
                  <select
                    id="landing-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LandingStatus)}
                    className={selectCls}
                  >
                    <option value="draft">Draft</option>
                    <option value="live">Live</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8A86]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-[#1A1A18]">
              Sections ({sections.length})
            </h3>
            {sections.length === 0 ? (
              <p className="text-[12px] italic text-[#8A877F]">No sections</p>
            ) : (
              sections.map((s, i) => (
                <div key={s.id} className="mb-1.5 flex items-center gap-2 text-[12px] last:mb-0">
                  <span className="w-4 text-[10px] text-[#8A877F]">{i + 1}.</span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      s.enabled ? "bg-emerald-400" : "bg-[#8B8A86]",
                    )}
                  />
                  <span className={s.enabled ? "text-[#2B2A28]" : "text-[#8A877F] line-through"}>
                    {s.label}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#1A1A18]">
              <Target size={13} className="text-[#C8924A]" />
              Conv. Goals ({goals.length})
            </h3>
            {goals.map((g) => (
              <p key={g.id} className="mb-1 text-[12px] text-[#4B4A46]">
                {g.label}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
