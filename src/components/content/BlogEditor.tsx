"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  ExternalLink,
  Bold,
  Italic,
  List,
  Link2,
  Image,
  Quote,
  Code,
  Heading1,
  Heading2,
  ChevronDown,
  Plus,
  X,
  Calendar,
  Clock,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { BlogCategory, BlogStatus } from "./BlogTable";

interface BlogEditorProps {
  postId?: string;
  isEdit?: boolean;
}

const CATEGORY_OPTIONS: { value: BlogCategory; label: string }[] = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bedroom", label: "Bedroom" },
  { value: "inspiration", label: "Inspiration" },
  { value: "how_to", label: "How To" },
  { value: "news", label: "News" },
  { value: "case_study", label: "Case Study" },
];

const AUTHORS = ["Sarah Alderton", "Marcus Webb", "Jade Nguyen", "Admin"];

const TOOLBAR_ITEMS = [
  { icon: Heading1, label: "H1" },
  { icon: Heading2, label: "H2" },
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: List, label: "List" },
  { icon: Quote, label: "Quote" },
  { icon: Link2, label: "Link" },
  { icon: Image, label: "Image" },
  { icon: Code, label: "Code" },
];

export function BlogEditor({ isEdit = false }: BlogEditorProps) {
  const [title, setTitle] = useState(isEdit ? "10 Kitchen Design Trends for 2026" : "");
  const [slug, setSlug] = useState(isEdit ? "kitchen-design-trends-2026" : "");
  const [excerpt, setExcerpt] = useState(
    isEdit
      ? "Discover the bold new directions shaping kitchen design this year, from handleless cabinetry to statement islands."
      : "",
  );
  const [body, setBody] = useState(
    isEdit
      ? "## Introduction\n\nThe kitchen has always been the heart of the home. In 2026, designers are pushing boundaries further than ever...\n\n## 1. Handleless Everything\n\nHandleless cabinetry continues its dominance..."
      : "",
  );
  const [category, setCategory] = useState<BlogCategory>("kitchen");
  const [author, setAuthor] = useState(AUTHORS[0]);
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [tags, setTags] = useState<string[]>(isEdit ? ["kitchen", "trends", "2026"] : []);
  const [tagInput, setTagInput] = useState("");
  const [scheduleFor, setSchedule] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setTab] = useState<"write" | "preview">("write");

  const autoSlug = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

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

  const selectCls =
    "appearance-none w-full h-9 rounded-[9px] border border-[#D9D5CD] bg-white px-3 pr-7 text-[12.5px] text-[#2B2A28] focus:border-[#C8924A]/50 focus:outline-none transition-colors";

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/content/blog"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#D9D5CD] bg-white text-[#8B8A86] transition-colors hover:text-[#C8924A]"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-[17px] font-bold text-[#1A1A18]">
              {isEdit ? "Edit Post" : "New Blog Post"}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#6B6B68]">
              {status === "published" && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Published
                </span>
              )}
              {status === "draft" && <span className="text-[#6B6B68]">Draft</span>}
              {status === "scheduled" && (
                <span className="flex items-center gap-1 text-blue-400">
                  <Calendar size={10} /> Scheduled
                </span>
              )}
            </p>
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
            onClick={() => handleSave("published")}
            disabled={saving || !title}
            className={cn(
              "flex h-9 items-center gap-2 rounded-[9px] px-4 text-[12.5px] font-medium transition-all disabled:opacity-50",
              saved
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#C8924A] text-white hover:bg-[#B87E3E]",
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            {saved ? "Published!" : saving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main editor */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Title */}
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title…"
              className="mb-3 w-full border-b border-[#E8E6E1] bg-transparent pb-3 text-[22px] font-bold text-[#1A1A18] placeholder:text-[#8A877F] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-mono text-[11px] text-[#8A877F]">/blog/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent font-mono text-[11.5px] text-[#6B6B68] transition-colors focus:text-[#C8924A] focus:outline-none"
              />
            </div>
          </div>

          {/* Rich text area */}
          <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white">
            {/* Write / Preview tabs */}
            <div className="flex items-center border-b border-[#E8E6E1] bg-[#FCFBF9]">
              {(["write", "preview"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTab(tab)}
                  className={cn(
                    "px-5 py-3 text-[12px] font-medium capitalize transition-all",
                    activeTab === tab
                      ? "-mb-px border-b-2 border-[#C8924A] text-[#C8924A]"
                      : "text-[#6B6B68] hover:text-[#C8924A]",
                  )}
                >
                  {tab}
                </button>
              ))}
              {/* Toolbar */}
              <div className="ml-auto flex items-center gap-0.5 border-l border-[#E8E6E1] px-3">
                {TOOLBAR_ITEMS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    title={label}
                    className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[#8B8A86] transition-all hover:bg-[#F5F3EF] hover:text-[#C8924A]"
                  >
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
                className="w-full resize-none bg-transparent px-5 py-4 font-mono text-[13.5px] leading-relaxed text-[#2B2A28] placeholder:text-[#8A877F] focus:outline-none"
              />
            ) : (
              <div className="min-h-[400px] px-5 py-4">
                {body ? (
                  <div className="max-w-none">
                    {body.split("\n").map((line, i) => {
                      if (line.startsWith("## "))
                        return (
                          <h2 key={i} className="mb-2 mt-4 text-[18px] font-bold text-[#1A1A18]">
                            {line.slice(3)}
                          </h2>
                        );
                      if (line.startsWith("# "))
                        return (
                          <h1 key={i} className="mb-2 mt-4 text-[22px] font-bold text-[#1A1A18]">
                            {line.slice(2)}
                          </h1>
                        );
                      if (line === "") return <br key={i} />;
                      return (
                        <p key={i} className="mb-2 text-[13.5px] leading-relaxed text-[#4B4A46]">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] italic text-[#8A877F]">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <label
              htmlFor="excerpt"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A776F]"
            >
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="A short description shown in listings and meta descriptions…"
              className="w-full resize-none rounded-[9px] border border-[#D9D5CD] bg-white px-3 py-2.5 text-[13px] text-[#2B2A28] transition-colors placeholder:text-[#8A877F] focus:border-[#C8924A]/50 focus:outline-none"
            />
            <p className="mt-1 text-right text-[11px] text-[#8A877F]">{excerpt.length}/200</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Publish controls */}
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-[#1A1A18]">Publish Settings</h3>

            <div className="flex flex-col gap-3">
              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BlogStatus)}
                    className={selectCls}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8A86]"
                  />
                </div>
              </div>

              {/* Scheduled date */}
              {status === "scheduled" && (
                <div>
                  <label
                    htmlFor="schedule"
                    className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                  >
                    <Clock size={10} /> Publish At
                  </label>
                  <input
                    id="schedule"
                    type="datetime-local"
                    value={scheduleFor}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="h-9 w-full rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12px] text-[#2B2A28] transition-colors focus:border-[#C8924A]/50 focus:outline-none"
                  />
                </div>
              )}

              {/* Author */}
              <div>
                <label
                  htmlFor="author"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Author
                </label>
                <div className="relative">
                  <select
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className={selectCls}
                  >
                    {AUTHORS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8A86]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7A776F]"
                >
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BlogCategory)}
                    className={selectCls}
                  >
                    {CATEGORY_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8A86]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Featured image */}
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-[#1A1A18]">Featured Image</h3>
            <div className="group flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#D9D5CD] bg-[#FCFBF9] transition-colors hover:border-[#C8924A]/40">
              <Upload
                size={18}
                className="text-[#8B8A86] transition-colors group-hover:text-[#C8924A]"
              />
              <p className="text-center text-[11.5px] text-[#8A877F] transition-colors group-hover:text-[#6B6B68]">
                Click to upload
                <br />
                or drag & drop
              </p>
              <p className="text-[10px] text-[#8A877F]">JPG, PNG, WebP · Max 5MB</p>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-[#1A1A18]">Tags</h3>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full border border-[#C8924A]/20 bg-[#C8924A]/15 px-2.5 py-1 text-[11px] text-[#C8924A]"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="transition-colors hover:text-white"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <p className="text-[11px] italic text-[#8A877F]">No tags yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag…"
                className="h-8 flex-1 rounded-[8px] border border-[#D9D5CD] bg-white px-3 text-[12px] text-[#2B2A28] transition-colors placeholder:text-[#8A877F] focus:border-[#C8924A]/50 focus:outline-none"
              />
              <button
                onClick={addTag}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#C8924A]/15 text-[#C8924A] transition-all hover:bg-[#C8924A] hover:text-white"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
