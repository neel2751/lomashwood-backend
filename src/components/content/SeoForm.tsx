"use client";

import { useState } from "react";

import Image from "next/image";

import {
  Save,
  Loader2,
  Globe,
  Share2,
  Twitter,
  CheckCircle,
  AlertTriangle,
  Info,
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

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

function charBar(val: string, limit: number) {
  const pct = Math.min((val.length / limit) * 100, 100);
  const color =
    val.length > limit
      ? "bg-red-400"
      : val.length > limit * 0.85
        ? "bg-amber-400"
        : "bg-emerald-400";
  return { pct, color, over: val.length > limit };
}

function ScoreItem({ label, pass, warn }: { label: string; pass: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {pass ? (
        <CheckCircle size={12} className="shrink-0 text-emerald-400" />
      ) : warn ? (
        <AlertTriangle size={12} className="shrink-0 text-amber-400" />
      ) : (
        <AlertTriangle size={12} className="shrink-0 text-red-400" />
      )}
      <span className={pass ? "text-[#2B2A28]" : warn ? "text-amber-500" : "text-[#8B8A86]"}>
        {label}
      </span>
    </div>
  );
}

export function SeoForm({
  pageTitle = "Our Showroom",
  pageSlug = "/showroom",
  initialData,
  onSave,
}: SeoFormProps) {
  const SITE = "lomashwood.co.uk";

  const [metaTitle, setMetaTitle] = useState(
    initialData?.metaTitle ?? `${pageTitle} | Lomash Wood`,
  );
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [canonicalUrl, setCanonical] = useState(
    initialData?.canonicalUrl ?? `https://${SITE}${pageSlug}`,
  );
  const [noIndex, setNoIndex] = useState(initialData?.noIndex ?? false);
  const [noFollow, setNoFollow] = useState(initialData?.noFollow ?? false);
  const [ogTitle, setOgTitle] = useState(initialData?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(initialData?.ogDescription ?? "");
  const [ogImage, setOgImage] = useState(initialData?.ogImage ?? "");
  const [twitterCard, setTwitterCard] = useState<"summary" | "summary_large_image">(
    initialData?.twitterCard ?? "summary_large_image",
  );
  const [twitterTitle, setTwitterTitle] = useState(initialData?.twitterTitle ?? "");
  const [twitterDesc, setTwitterDesc] = useState(initialData?.twitterDescription ?? "");
  const [twitterImage, setTwitterImage] = useState(initialData?.twitterImage ?? "");
  const [structuredData, setStructuredData] = useState(initialData?.structuredData ?? "");
  const [activeTab, setTab] = useState<"seo" | "og" | "twitter" | "advanced">("seo");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const titleBar = charBar(metaTitle, TITLE_LIMIT);
  const descBar = charBar(metaDescription, DESCRIPTION_LIMIT);

  // SEO score checks
  const checks = [
    { label: "Meta title set", pass: metaTitle.trim().length > 0, warn: false },
    {
      label: `Title under ${TITLE_LIMIT} chars`,
      pass: metaTitle.length <= TITLE_LIMIT && metaTitle.length > 0,
      warn: false,
    },
    { label: "Meta description set", pass: metaDescription.trim().length > 0, warn: false },
    {
      label: `Description under ${DESCRIPTION_LIMIT} chars`,
      pass: metaDescription.length <= DESCRIPTION_LIMIT && metaDescription.length > 0,
      warn: false,
    },
    { label: "Canonical URL set", pass: canonicalUrl.trim().length > 0, warn: false },
    { label: "Not blocked (noindex off)", pass: !noIndex, warn: noIndex },
    { label: "Open Graph image set", pass: ogImage.trim().length > 0, warn: true },
    {
      label: "Twitter card configured",
      pass: twitterTitle.trim().length > 0 || ogTitle.length > 0,
      warn: true,
    },
  ];
  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  const scoreColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 55
        ? "text-[#C8924A]"
        : score >= 30
          ? "text-amber-400"
          : "text-red-400";

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.({
      metaTitle,
      metaDescription,
      canonicalUrl,
      noIndex,
      noFollow,
      ogTitle,
      ogDescription,
      ogImage,
      twitterCard,
      twitterTitle,
      twitterDescription: twitterDesc,
      twitterImage,
      structuredData,
    });
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls =
    "w-full h-9 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12.5px] text-[#2B2A28] placeholder:text-[#8B8A86] focus:border-[#C8924A]/50 focus:outline-none transition-colors";
  const textareaCls =
    "w-full resize-none rounded-[9px] border border-[#D9D5CD] bg-white px-3 py-2.5 text-[12.5px] text-[#2B2A28] placeholder:text-[#8B8A86] focus:border-[#C8924A]/50 focus:outline-none transition-colors";

  const TABS = [
    { id: "seo", label: "SEO", icon: Globe },
    { id: "og", label: "Open Graph", icon: Share2 },
    { id: "twitter", label: "Twitter", icon: Twitter },
    { id: "advanced", label: "Advanced", icon: Info },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Main form */}
      <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white lg:col-span-2">
        {/* Header + save */}
        <div className="flex items-center justify-between border-b border-[#E8E6E1] bg-[#FCFBF9] px-5 py-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[#1A1A18]">SEO Settings</h3>
            <p className="mt-0.5 font-mono text-[12px] text-[#6B6B68]">{pageSlug}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex h-9 items-center gap-2 rounded-[9px] px-4 text-[12.5px] font-medium transition-all disabled:opacity-50",
              saved
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save SEO"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8E6E1]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium transition-all",
                activeTab === id
                  ? "-mb-px border-b-2 border-[#C8924A] text-[#C8924A]"
                  : "text-[#6B6B68] hover:text-[#C8924A]",
              )}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* SEO tab */}
          {activeTab === "seo" && (
            <>
              {/* Meta title */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="meta-title"
                    className="text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                  >
                    Meta Title
                  </label>
                  <span
                    className={cn("text-[11px]", titleBar.over ? "text-red-500" : "text-[#8A877F]")}
                  >
                    {metaTitle.length}/{TITLE_LIMIT}
                  </span>
                </div>
                <input
                  id="meta-title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Page title for search engines…"
                  className={inputCls}
                />
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#E8E6E1]">
                  <div
                    className={cn("h-full rounded-full transition-all", titleBar.color)}
                    style={{ width: `${titleBar.pct}%` }}
                  />
                </div>
              </div>

              {/* Meta description */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="meta-description"
                    className="text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                  >
                    Meta Description
                  </label>
                  <span
                    className={cn("text-[11px]", descBar.over ? "text-red-500" : "text-[#8A877F]")}
                  >
                    {metaDescription.length}/{DESCRIPTION_LIMIT}
                  </span>
                </div>
                <textarea
                  id="meta-description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief summary for search result listings…"
                  className={textareaCls}
                />
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#E8E6E1]">
                  <div
                    className={cn("h-full rounded-full transition-all", descBar.color)}
                    style={{ width: `${descBar.pct}%` }}
                  />
                </div>
              </div>

              {/* SERP preview */}
              <div className="rounded-[12px] border border-[#E8E6E1] bg-[#FCFBF9] p-4">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]">
                  <Globe size={10} /> Google Preview
                </p>
                <p className="mb-0.5 font-mono text-[11px] text-[#6B6B68]">
                  {SITE}
                  {pageSlug}
                </p>
                <p className="cursor-pointer text-[16px] leading-tight text-blue-400 hover:underline">
                  {metaTitle || "Page title appears here"}
                </p>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[#4B4A46]">
                  {metaDescription ||
                    "Your meta description will appear here. Write a compelling summary to encourage clicks from search results."}
                </p>
              </div>
            </>
          )}

          {/* Open Graph tab */}
          {activeTab === "og" && (
            <>
              <div>
                <label
                  htmlFor="og-title"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  OG Title
                </label>
                <input
                  id="og-title"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder={metaTitle || "Defaults to meta title…"}
                  className={inputCls}
                />
              </div>
              <div>
                <label
                  htmlFor="og-description"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  OG Description
                </label>
                <textarea
                  id="og-description"
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  rows={3}
                  placeholder={metaDescription || "Defaults to meta description…"}
                  className={textareaCls}
                />
              </div>
              <div>
                <label
                  htmlFor="og-image"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  OG Image URL
                </label>
                <input
                  id="og-image"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://lomashwood.co.uk/media/…"
                  className={inputCls}
                />
                <p className="mt-1 text-[11px] text-[#8A877F]">Recommended: 1200×630px JPG/PNG</p>
              </div>

              {/* OG preview card */}
              <div className="overflow-hidden rounded-[12px] border border-[#E8E6E1] bg-white">
                <div className="flex h-[140px] items-center justify-center overflow-hidden bg-[#F5F3EF]">
                  {ogImage ? (
                    <Image
                      src={ogImage}
                      alt="Open Graph preview"
                      width={300}
                      height={140}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Share2 size={28} className="text-[#8B8A86]" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-[#6B6B68]">{SITE}</p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] font-semibold text-[#1A1A18]">
                    {ogTitle || metaTitle || "Page title"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[#4B4A46]">
                    {ogDescription || metaDescription || "Description…"}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Twitter tab */}
          {activeTab === "twitter" && (
            <>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]">
                  Card Type
                </label>
                <div className="flex gap-2">
                  {(["summary", "summary_large_image"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setTwitterCard(v)}
                      className={cn(
                        "h-9 flex-1 rounded-[9px] border px-3 text-[12px] font-medium transition-all",
                        twitterCard === v
                          ? "border-[#C8924A]/50 bg-[#C8924A]/15 text-[#C8924A]"
                          : "border-[#D9D5CD] bg-white text-[#6B6B68] hover:border-[#C8924A]/30",
                      )}
                    >
                      {v === "summary" ? "Summary" : "Large Image"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="twitter-title"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Twitter Title
                </label>
                <input
                  id="twitter-title"
                  value={twitterTitle}
                  onChange={(e) => setTwitterTitle(e.target.value)}
                  placeholder={ogTitle || metaTitle || "Defaults to OG / meta title…"}
                  className={inputCls}
                />
              </div>
              <div>
                <label
                  htmlFor="twitter-description"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Twitter Description
                </label>
                <textarea
                  id="twitter-description"
                  value={twitterDesc}
                  onChange={(e) => setTwitterDesc(e.target.value)}
                  rows={3}
                  placeholder={
                    ogDescription || metaDescription || "Defaults to OG / meta description…"
                  }
                  className={textareaCls}
                />
              </div>
              <div>
                <label
                  htmlFor="twitter-image"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Twitter Image URL
                </label>
                <input
                  id="twitter-image"
                  value={twitterImage}
                  onChange={(e) => setTwitterImage(e.target.value)}
                  placeholder={ogImage || "https://lomashwood.co.uk/media/…"}
                  className={inputCls}
                />
              </div>
            </>
          )}

          {/* Advanced tab */}
          {activeTab === "advanced" && (
            <>
              <div>
                <label
                  htmlFor="canonical-url"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Canonical URL
                </label>
                <input
                  id="canonical-url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonical(e.target.value)}
                  className={inputCls}
                />
              </div>
              {/* Robots */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]">
                  Robots Directives
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      state: noIndex,
                      setter: setNoIndex,
                      label: "noindex",
                      desc: "Prevent this page from appearing in search results",
                      id: "robots-noindex",
                    },
                    {
                      state: noFollow,
                      setter: setNoFollow,
                      label: "nofollow",
                      desc: "Tell crawlers not to follow links on this page",
                      id: "robots-nofollow",
                    },
                  ].map(({ state, setter, label, desc, id }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[10px] border border-[#E8E6E1] bg-[#FCFBF9] px-4 py-3"
                    >
                      <div>
                        <p className="font-mono text-[12.5px] font-semibold text-[#1A1A18]">
                          {label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6B6B68]">{desc}</p>
                      </div>
                      <button
                        id={id}
                        onClick={() => setter(!state)}
                        className={cn(
                          "relative h-6 w-10 shrink-0 rounded-full border transition-all",
                          state ? "border-red-400 bg-red-400" : "border-[#D9D5CD] bg-white",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                            state ? "left-[18px]" : "left-0.5",
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                {noIndex && (
                  <div className="mt-2 flex items-center gap-2 rounded-[8px] border border-red-400/20 bg-red-400/10 px-3 py-2 text-[12px] text-red-400">
                    <AlertTriangle size={12} /> This page will be excluded from search engines
                  </div>
                )}
              </div>
              {/* Structured data */}
              <div>
                <label
                  htmlFor="structured-data"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Structured Data (JSON-LD)
                </label>
                <textarea
                  id="structured-data"
                  value={structuredData}
                  onChange={(e) => setStructuredData(e.target.value)}
                  rows={6}
                  placeholder={
                    '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": ""\n}'
                  }
                  className={cn(textareaCls, "font-mono text-[11.5px]")}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Score panel */}
      <div className="flex flex-col gap-4">
        <div className="sticky top-5 rounded-[16px] border border-[#E8E6E1] bg-white p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-[#1A1A18]">SEO Score</h3>

          {/* Score ring */}
          <div className="mb-5 flex flex-col items-center">
            <div className="relative mb-2 h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="#E8E6E1" strokeWidth="8" />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  fill="none"
                  stroke={
                    score >= 80
                      ? "#34d399"
                      : score >= 55
                        ? "#C8924A"
                        : score >= 30
                          ? "#fbbf24"
                          : "#f87171"
                  }
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
              {score >= 80
                ? "Excellent"
                : score >= 55
                  ? "Good"
                  : score >= 30
                    ? "Needs work"
                    : "Poor"}
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
