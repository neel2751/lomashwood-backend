"use client";

import { useState } from "react";

import {
  Save, Loader2, Globe, Share2,
  Twitter, CheckCircle, AlertTriangle, Info,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
  noFollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: "summary" | "summary_large_image";
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  structuredData: string;
}

interface SeoFormProps {
  pageTitle?: string;
  pageSlug?: string;
  initialData?: Partial<SeoData>;
  onSave?: (data: SeoData) => void;
}

const TITLE_LIMIT       = 60;
const DESCRIPTION_LIMIT = 160;

function charBar(val: string, limit: number) {
  const pct   = Math.min((val.length / limit) * 100, 100);
  const color = val.length > limit ? "bg-red-400" : val.length > limit * 0.85 ? "bg-amber-400" : "bg-emerald-400";
  return { pct, color, over: val.length > limit };
}

function ScoreItem({ label, pass, warn }: { label: string; pass: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {pass
        ? <CheckCircle size={12} className="text-emerald-400 shrink-0" />
        : warn
          ? <AlertTriangle size={12} className="text-amber-400 shrink-0" />
          : <AlertTriangle size={12} className="text-red-400 shrink-0" />
      }
      <span className={pass ? "text-[#7A6045]" : warn ? "text-amber-400" : "text-[#5A4232]"}>{label}</span>
    </div>
  );
}

export function SeoForm({ pageTitle = "Our Showroom", pageSlug = "/showroom", initialData, onSave }: SeoFormProps) {
  const SITE = "lomashwood.co.uk";

  const [metaTitle,       setMetaTitle]       = useState(initialData?.metaTitle       ?? `${pageTitle} | Lomash Wood`);
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [canonicalUrl,    setCanonical]        = useState(initialData?.canonicalUrl    ?? `https://${SITE}${pageSlug}`);
  const [noIndex,         setNoIndex]          = useState(initialData?.noIndex         ?? false);
  const [noFollow,        setNoFollow]         = useState(initialData?.noFollow        ?? false);
  const [ogTitle,         setOgTitle]          = useState(initialData?.ogTitle         ?? "");
  const [ogDescription,   setOgDescription]    = useState(initialData?.ogDescription   ?? "");
  const [ogImage,         setOgImage]          = useState(initialData?.ogImage         ?? "");
  const [twitterCard,     setTwitterCard]      = useState<"summary"|"summary_large_image">(initialData?.twitterCard ?? "summary_large_image");
  const [twitterTitle,    setTwitterTitle]     = useState(initialData?.twitterTitle    ?? "");
  const [twitterDesc,     setTwitterDesc]      = useState(initialData?.twitterDescription ?? "");
  const [twitterImage,    setTwitterImage]     = useState(initialData?.twitterImage    ?? "");
  const [structuredData,  setStructuredData]   = useState(initialData?.structuredData  ?? "");
  const [activeTab,       setTab]              = useState<"seo"|"og"|"twitter"|"advanced">("seo");
  const [saving,          setSaving]           = useState(false);
  const [saved,           setSaved]            = useState(false);

  const titleBar = charBar(metaTitle, TITLE_LIMIT);
  const descBar  = charBar(metaDescription, DESCRIPTION_LIMIT);

  // SEO score checks
  const checks = [
    { label: "Meta title set",             pass: metaTitle.trim().length > 0,                        warn: false },
    { label: `Title under ${TITLE_LIMIT} chars`,   pass: metaTitle.length <= TITLE_LIMIT && metaTitle.length > 0, warn: false },
    { label: "Meta description set",       pass: metaDescription.trim().length > 0,                  warn: false },
    { label: `Description under ${DESCRIPTION_LIMIT} chars`, pass: metaDescription.length <= DESCRIPTION_LIMIT && metaDescription.length > 0, warn: false },
    { label: "Canonical URL set",          pass: canonicalUrl.trim().length > 0,                     warn: false },
    { label: "Not blocked (noindex off)",  pass: !noIndex,                                           warn: noIndex },
    { label: "Open Graph image set",       pass: ogImage.trim().length > 0,                          warn: true  },
    { label: "Twitter card configured",    pass: twitterTitle.trim().length > 0 || ogTitle.length > 0, warn: true },
  ];
  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  const scoreColor =
    score >= 80 ? "text-emerald-400" :
    score >= 55 ? "text-[#C8924A]"   :
    score >= 30 ? "text-amber-400"   : "text-red-400";
  const scoreFill =
    score >= 80 ? "bg-emerald-400" :
    score >= 55 ? "bg-[#C8924A]"   :
    score >= 30 ? "bg-amber-400"   : "bg-red-400";

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({ metaTitle, metaDescription, canonicalUrl, noIndex, noFollow, ogTitle, ogDescription, ogImage, twitterCard, twitterTitle, twitterDescription: twitterDesc, twitterImage, structuredData });
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = "w-full h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";
  const textareaCls = "w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none";

  const TABS = [
    { id: "seo",      label: "SEO",        icon: Globe   },
    { id: "og",       label: "Open Graph", icon: Share2  },
    { id: "twitter",  label: "Twitter",    icon: Twitter },
    { id: "advanced", label: "Advanced",   icon: Info    },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Main form */}
      <div className="lg:col-span-2 rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
        {/* Header + save */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A]">
          <div>
            <h3 className="text-[14px] font-semibold text-[#E8D5B7]">SEO Settings</h3>
            <p className="text-[12px] text-[#5A4232] mt-0.5 font-mono">{pageSlug}</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className={cn("flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all disabled:opacity-50",
              saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]")}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save SEO"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2E231A]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium transition-all",
                activeTab === id
                  ? "text-[#C8924A] border-b-2 border-[#C8924A] -mb-px"
                  : "text-[#5A4232] hover:text-[#C8924A]")}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* SEO tab */}
          {activeTab === "seo" && (
            <>
              {/* Meta title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E]">Meta Title</label>
                  <span className={cn("text-[11px]", titleBar.over ? "text-red-400" : "text-[#3D2E1E]")}>
                    {metaTitle.length}/{TITLE_LIMIT}
                  </span>
                </div>
                <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Page title for search engines…" className={inputCls} />
                <div className="mt-1.5 h-1 rounded-full bg-[#2E231A] overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", titleBar.color)}
                    style={{ width: `${titleBar.pct}%` }} />
                </div>
              </div>

              {/* Meta description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E]">Meta Description</label>
                  <span className={cn("text-[11px]", descBar.over ? "text-red-400" : "text-[#3D2E1E]")}>
                    {metaDescription.length}/{DESCRIPTION_LIMIT}
                  </span>
                </div>
                <textarea value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3} placeholder="Brief summary for search result listings…"
                  className={textareaCls} />
                <div className="mt-1.5 h-1 rounded-full bg-[#2E231A] overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", descBar.color)}
                    style={{ width: `${descBar.pct}%` }} />
                </div>
              </div>

              {/* SERP preview */}
              <div className="rounded-[12px] bg-[#2E231A] border border-[#3D2E1E] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-3 flex items-center gap-1.5">
                  <Globe size={10} /> Google Preview
                </p>
                <p className="text-[11px] text-[#5A4232] mb-0.5 font-mono">{SITE}{pageSlug}</p>
                <p className="text-[16px] text-blue-400 hover:underline cursor-pointer leading-tight">
                  {metaTitle || "Page title appears here"}
                </p>
                <p className="text-[12.5px] text-[#7A6045] mt-1 leading-snug line-clamp-2">
                  {metaDescription || "Your meta description will appear here. Write a compelling summary to encourage clicks from search results."}
                </p>
              </div>
            </>
          )}

          {/* Open Graph tab */}
          {activeTab === "og" && (
            <>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">OG Title</label>
                <input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)}
                  placeholder={metaTitle || "Defaults to meta title…"} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">OG Description</label>
                <textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} rows={3}
                  placeholder={metaDescription || "Defaults to meta description…"} className={textareaCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">OG Image URL</label>
                <input value={ogImage} onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://lomashwood.co.uk/media/…" className={inputCls} />
                <p className="text-[11px] text-[#3D2E1E] mt-1">Recommended: 1200×630px JPG/PNG</p>
              </div>

              {/* OG preview card */}
              <div className="rounded-[12px] bg-[#2E231A] border border-[#3D2E1E] overflow-hidden">
                <div className="h-[140px] bg-[#3D2E1E] flex items-center justify-center">
                  {ogImage
                    ? <img src={ogImage} alt="" className="w-full h-full object-cover" />
                    : <Share2 size={28} className="text-[#5A4232]" />
                  }
                </div>
                <div className="p-3">
                  <p className="text-[10.5px] text-[#5A4232] uppercase tracking-wider">{SITE}</p>
                  <p className="text-[13px] font-semibold text-[#E8D5B7] mt-0.5 line-clamp-1">{ogTitle || metaTitle || "Page title"}</p>
                  <p className="text-[11.5px] text-[#7A6045] mt-0.5 line-clamp-2">{ogDescription || metaDescription || "Description…"}</p>
                </div>
              </div>
            </>
          )}

          {/* Twitter tab */}
          {activeTab === "twitter" && (
            <>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-2">Card Type</label>
                <div className="flex gap-2">
                  {(["summary","summary_large_image"] as const).map((v) => (
                    <button key={v} onClick={() => setTwitterCard(v)}
                      className={cn("flex-1 h-9 px-3 rounded-[9px] border text-[12px] font-medium transition-all",
                        twitterCard === v ? "bg-[#C8924A]/15 border-[#C8924A]/50 text-[#C8924A]"
                        : "bg-[#2E231A] border-[#3D2E1E] text-[#5A4232] hover:border-[#C8924A]/30")}>
                      {v === "summary" ? "Summary" : "Large Image"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Twitter Title</label>
                <input value={twitterTitle} onChange={(e) => setTwitterTitle(e.target.value)}
                  placeholder={ogTitle || metaTitle || "Defaults to OG / meta title…"} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Twitter Description</label>
                <textarea value={twitterDesc} onChange={(e) => setTwitterDesc(e.target.value)} rows={3}
                  placeholder={ogDescription || metaDescription || "Defaults to OG / meta description…"} className={textareaCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Twitter Image URL</label>
                <input value={twitterImage} onChange={(e) => setTwitterImage(e.target.value)}
                  placeholder={ogImage || "https://lomashwood.co.uk/media/…"} className={inputCls} />
              </div>
            </>
          )}

          {/* Advanced tab */}
          {activeTab === "advanced" && (
            <>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Canonical URL</label>
                <input value={canonicalUrl} onChange={(e) => setCanonical(e.target.value)} className={inputCls} />
              </div>
              {/* Robots */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-2">Robots Directives</label>
                <div className="flex flex-col gap-2">
                  {[
                    { state: noIndex, setter: setNoIndex, label: "noindex", desc: "Prevent this page from appearing in search results" },
                    { state: noFollow, setter: setNoFollow, label: "nofollow", desc: "Tell crawlers not to follow links on this page" },
                  ].map(({ state, setter, label, desc }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E]">
                      <div>
                        <p className="text-[12.5px] font-semibold text-[#C8B99A] font-mono">{label}</p>
                        <p className="text-[11px] text-[#5A4232] mt-0.5">{desc}</p>
                      </div>
                      <button onClick={() => setter(!state)}
                        className={cn("w-10 h-6 rounded-full border relative transition-all shrink-0",
                          state ? "bg-red-400 border-red-400" : "bg-[#1C1611] border-[#3D2E1E]")}>
                        <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                          state ? "left-[18px]" : "left-0.5")} />
                      </button>
                    </div>
                  ))}
                </div>
                {noIndex && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-red-400/10 border border-red-400/20 text-red-400 text-[12px]">
                    <AlertTriangle size={12} /> This page will be excluded from search engines
                  </div>
                )}
              </div>
              {/* Structured data */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Structured Data (JSON-LD)</label>
                <textarea value={structuredData} onChange={(e) => setStructuredData(e.target.value)} rows={6}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": ""\n}'}
                  className={cn(textareaCls, "font-mono text-[11.5px]")} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Score panel */}
      <div className="flex flex-col gap-4">
        <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5 sticky top-5">
          <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-4">SEO Score</h3>

          {/* Score ring */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative w-24 h-24 mb-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="#2E231A" strokeWidth="8" />
                <circle cx="48" cy="48" r="38" fill="none"
                  stroke={score >= 80 ? "#34d399" : score >= 55 ? "#C8924A" : score >= 30 ? "#fbbf24" : "#f87171"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${score * 2.39} 239`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-[22px] font-bold", scoreColor)}>{score}</span>
              </div>
            </div>
            <p className={cn("text-[13px] font-semibold", scoreColor)}>
              {score >= 80 ? "Excellent" : score >= 55 ? "Good" : score >= 30 ? "Needs work" : "Poor"}
            </p>
          </div>

          {/* Checks */}
          <div className="flex flex-col gap-2">
            {checks.map((c) => (
              <ScoreItem key={c.label} label={c.label} pass={c.pass} warn={!c.pass && c.warn} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}