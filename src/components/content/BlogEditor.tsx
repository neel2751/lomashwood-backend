"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft, Save, Loader2, Eye, ExternalLink,
  Bold, Italic, List, Link2, Image, Quote,
  Code, Heading1, Heading2, ChevronDown,
  Plus, X, Calendar, Clock, Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { BlogCategory, BlogStatus } from "./BlogTable";

interface BlogEditorProps {
  postId?: string;
  isEdit?: boolean;
}

const CATEGORY_OPTIONS: { value: BlogCategory; label: string }[] = [
  { value: "kitchen",     label: "Kitchen"     },
  { value: "bedroom",     label: "Bedroom"     },
  { value: "inspiration", label: "Inspiration" },
  { value: "how_to",      label: "How To"      },
  { value: "news",        label: "News"        },
  { value: "case_study",  label: "Case Study"  },
];

const AUTHORS = ["Sarah Alderton", "Marcus Webb", "Jade Nguyen", "Admin"];

const TOOLBAR_ITEMS = [
  { icon: Heading1, label: "H1"      },
  { icon: Heading2, label: "H2"      },
  { icon: Bold,     label: "Bold"    },
  { icon: Italic,   label: "Italic"  },
  { icon: List,     label: "List"    },
  { icon: Quote,    label: "Quote"   },
  { icon: Link2,    label: "Link"    },
  { icon: Image,    label: "Image"   },
  { icon: Code,     label: "Code"    },
];

export function BlogEditor({ postId, isEdit = false }: BlogEditorProps) {
  const [title,       setTitle]    = useState(isEdit ? "10 Kitchen Design Trends for 2026" : "");
  const [slug,        setSlug]     = useState(isEdit ? "kitchen-design-trends-2026" : "");
  const [excerpt,     setExcerpt]  = useState(isEdit ? "Discover the bold new directions shaping kitchen design this year, from handleless cabinetry to statement islands." : "");
  const [body,        setBody]     = useState(isEdit ? "## Introduction\n\nThe kitchen has always been the heart of the home. In 2026, designers are pushing boundaries further than ever...\n\n## 1. Handleless Everything\n\nHandleless cabinetry continues its dominance..." : "");
  const [category,    setCategory] = useState<BlogCategory>("kitchen");
  const [author,      setAuthor]   = useState(AUTHORS[0]);
  const [status,      setStatus]   = useState<BlogStatus>("draft");
  const [tags,        setTags]     = useState<string[]>(isEdit ? ["kitchen","trends","2026"] : []);
  const [tagInput,    setTagInput] = useState("");
  const [scheduleFor, setSchedule] = useState("");
  const [saving,      setSaving]   = useState(false);
  const [saved,       setSaved]    = useState(false);
  const [activeTab,   setTab]      = useState<"write" | "preview">("write");

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!isEdit) setSlug(autoSlug(v));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags((t) => [...t, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((t) => t.filter((x) => x !== tag));

  const handleSave = async (s: BlogStatus = status) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setStatus(s);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const selectCls = "appearance-none w-full h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/content/blog"
            className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-[17px] font-bold text-[#E8D5B7]">{isEdit ? "Edit Post" : "New Blog Post"}</h1>
            <p className="text-[11.5px] text-[#5A4232] mt-0.5 flex items-center gap-1.5">
              {status === "published" && <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Published</span>}
              {status === "draft"     && <span className="text-[#5A4232]">Draft</span>}
              {status === "scheduled" && <span className="flex items-center gap-1 text-blue-400"><Calendar size={10} /> Scheduled</span>}
            </p>
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
          <button onClick={() => handleSave("published")} disabled={saving || !title}
            className={cn("flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all disabled:opacity-50",
              saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]")}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            {saved ? "Published!" : saving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main editor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Title */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title…"
              className="w-full bg-transparent text-[22px] font-bold text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none border-b border-[#2E231A] pb-3 mb-3"
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#3D2E1E] font-mono shrink-0">/blog/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent text-[11.5px] font-mono text-[#5A4232] focus:outline-none focus:text-[#C8924A] transition-colors" />
            </div>
          </div>

          {/* Rich text area */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
            {/* Write / Preview tabs */}
            <div className="flex items-center border-b border-[#2E231A]">
              {(["write","preview"] as const).map((tab) => (
                <button key={tab} onClick={() => setTab(tab)}
                  className={cn("px-5 py-3 text-[12px] font-medium capitalize transition-all",
                    activeTab === tab ? "text-[#C8924A] border-b-2 border-[#C8924A] -mb-px" : "text-[#5A4232] hover:text-[#C8924A]")}>
                  {tab}
                </button>
              ))}
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 ml-auto px-3 border-l border-[#2E231A]">
                {TOOLBAR_ITEMS.map(({ icon: Icon, label }) => (
                  <button key={label} title={label}
                    className="w-7 h-7 flex items-center justify-center rounded-[5px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "write" ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={20}
                placeholder="Start writing your post… (Markdown supported)"
                className="w-full px-5 py-4 bg-transparent text-[13.5px] text-[#C8B99A] placeholder:text-[#3D2E1E] focus:outline-none resize-none leading-relaxed font-mono"
              />
            ) : (
              <div className="px-5 py-4 min-h-[400px]">
                {body ? (
                  <div className="prose prose-invert max-w-none">
                    {body.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) return <h2 key={i} className="text-[18px] font-bold text-[#E8D5B7] mt-4 mb-2">{line.slice(3)}</h2>;
                      if (line.startsWith("# "))  return <h1 key={i} className="text-[22px] font-bold text-[#E8D5B7] mt-4 mb-2">{line.slice(2)}</h1>;
                      if (line === "")             return <br key={i} />;
                      return <p key={i} className="text-[13.5px] text-[#7A6045] leading-relaxed mb-2">{line}</p>;
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#3D2E1E] italic">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-2">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="A short description shown in listings and meta descriptions…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none"
            />
            <p className="text-[11px] text-[#3D2E1E] mt-1 text-right">{excerpt.length}/200</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Publish controls */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-4">Publish Settings</h3>

            <div className="flex flex-col gap-3">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Status</label>
                <div className="relative">
                  <select value={status} onChange={(e) => setStatus(e.target.value as BlogStatus)} className={selectCls}>
                    <option value="draft"     className="bg-[#1C1611]">Draft</option>
                    <option value="published" className="bg-[#1C1611]">Published</option>
                    <option value="scheduled" className="bg-[#1C1611]">Scheduled</option>
                    <option value="archived"  className="bg-[#1C1611]">Archived</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>

              {/* Scheduled date */}
              {status === "scheduled" && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1 flex items-center gap-1.5">
                    <Clock size={10} /> Publish At
                  </label>
                  <input type="datetime-local" value={scheduleFor}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#E8D5B7] focus:outline-none focus:border-[#C8924A]/50 transition-colors" />
                </div>
              )}

              {/* Author */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Author</label>
                <div className="relative">
                  <select value={author} onChange={(e) => setAuthor(e.target.value)} className={selectCls}>
                    {AUTHORS.map((a) => <option key={a} value={a} className="bg-[#1C1611]">{a}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Category</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value as BlogCategory)} className={selectCls}>
                    {CATEGORY_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value} className="bg-[#1C1611]">{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Featured image */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-3">Featured Image</h3>
            <div className="aspect-[16/9] rounded-[10px] bg-[#2E231A] border-2 border-dashed border-[#3D2E1E] flex flex-col items-center justify-center gap-2 hover:border-[#C8924A]/40 transition-colors cursor-pointer group">
              <Upload size={18} className="text-[#3D2E1E] group-hover:text-[#C8924A] transition-colors" />
              <p className="text-[11.5px] text-[#3D2E1E] group-hover:text-[#5A4232] transition-colors text-center">
                Click to upload<br />or drag & drop
              </p>
              <p className="text-[10px] text-[#3D2E1E]">JPG, PNG, WebP · Max 5MB</p>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#C8924A]/15 text-[#C8924A] border border-[#C8924A]/20">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
              {tags.length === 0 && <p className="text-[11px] text-[#3D2E1E] italic">No tags yet</p>}
            </div>
            <div className="flex gap-2">
              <input value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag…"
                className="flex-1 h-8 px-3 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors" />
              <button onClick={addTag}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-[#C8924A]/15 text-[#C8924A] hover:bg-[#C8924A] hover:text-white transition-all">
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}