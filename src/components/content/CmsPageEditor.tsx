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
  ChevronDown,
  Type,
  Image,
  Columns,
  Quote,
  Minus,
  Code,
  Video,
  CheckCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PageStatus = "published" | "draft" | "hidden";
type PageTemplate = "default" | "full_width" | "landing" | "product" | "contact";
type BlockType =
  | "hero"
  | "text"
  | "image"
  | "columns"
  | "quote"
  | "divider"
  | "cta"
  | "video"
  | "html";

interface ContentBlock {
  id: string;
  type: BlockType;
  label: string;
  content: Record<string, string>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "hero", label: "Hero", icon: Type, desc: "Full-width banner with heading & CTA" },
  { type: "text", label: "Rich Text", icon: Type, desc: "Paragraphs, headings, lists" },
  { type: "image", label: "Image", icon: Image, desc: "Single image with caption" },
  { type: "columns", label: "Two Columns", icon: Columns, desc: "Side-by-side content blocks" },
  { type: "quote", label: "Pull Quote", icon: Quote, desc: "Highlighted quote block" },
  { type: "divider", label: "Divider", icon: Minus, desc: "Horizontal rule" },
  { type: "cta", label: "Call to Action", icon: Type, desc: "Button block with heading" },
  { type: "video", label: "Video", icon: Video, desc: "Embedded video" },
  { type: "html", label: "Custom HTML", icon: Code, desc: "Raw HTML / embed code" },
];

const TEMPLATES: { value: PageTemplate; label: string; desc: string }[] = [
  { value: "default", label: "Default", desc: "Standard page with sidebar-safe width" },
  { value: "full_width", label: "Full Width", desc: "Edge-to-edge layout, no gutters" },
  { value: "landing", label: "Landing", desc: "No header nav — focused conversion" },
  { value: "product", label: "Product", desc: "Product range layout with filters" },
  { value: "contact", label: "Contact", desc: "Contact form integrated template" },
];

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function defaultContent(type: BlockType): Record<string, string> {
  const map: Record<BlockType, Record<string, string>> = {
    hero: {
      heading: "Discover Luxury Living",
      subheading: "Premium kitchens & bedrooms, crafted in Britain.",
      cta: "Book a Consultation",
      image: "",
    },
    text: { content: "Enter your content here…" },
    image: { src: "", alt: "", caption: "" },
    columns: { left: "Left column content…", right: "Right column content…" },
    quote: { quote: "Enter your pull quote…", attribution: "Name, Title" },
    divider: {},
    cta: {
      heading: "Ready to Transform Your Home?",
      subheading: "",
      button: "Book Now",
      url: "/book",
    },
    video: { url: "", caption: "" },
    html: { code: "<!-- custom HTML -->" },
  };
  return map[type];
}

function BlockEditor({
  block,
  onUpdate,
  onDelete,
}: {
  block: ContentBlock;
  onUpdate: (id: string, content: Record<string, string>) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const inputCls =
    "w-full h-9 px-3 rounded-[8px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#8B8A86] focus:outline-none focus:border-[#C8924A]/50 transition-colors";
  const textareaCls =
    "w-full px-3 py-2.5 rounded-[8px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#8B8A86] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none";

  const field = (key: string, placeholder: string, rows?: number) => (
    <div key={key}>
      <label
        htmlFor={`${block.id}-${key}`}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8A877F]"
      >
        {key.replace("_", " ")}
      </label>
      {rows ? (
        <textarea
          id={`${block.id}-${key}`}
          value={block.content[key] ?? ""}
          onChange={(e) => onUpdate(block.id, { ...block.content, [key]: e.target.value })}
          placeholder={placeholder}
          rows={rows}
          className={textareaCls}
        />
      ) : (
        <input
          id={`${block.id}-${key}`}
          value={block.content[key] ?? ""}
          onChange={(e) => onUpdate(block.id, { ...block.content, [key]: e.target.value })}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </div>
  );

  const renderFields = () => {
    switch (block.type) {
      case "hero":
        return (
          <>
            {field("heading", "Main heading…")}
            {field("subheading", "Subheading…")}
            {field("cta", "Button label")}
            {field("image", "Image URL or path")}
          </>
        );
      case "text":
        return <>{field("content", "Write your content…", 6)}</>;
      case "image":
        return (
          <>
            {field("src", "Image URL or upload path")}
            {field("alt", "Alt text (accessibility)")}
            {field("caption", "Caption (optional)")}
          </>
        );
      case "columns":
        return (
          <div className="grid grid-cols-2 gap-3">
            {field("left", "Left column…", 4)}
            {field("right", "Right column…", 4)}
          </div>
        );
      case "quote":
        return (
          <>
            {field("quote", "Enter quote text…", 3)}
            {field("attribution", "Author, Role")}
          </>
        );
      case "divider":
        return (
          <p className="text-[12px] italic text-[#8A877F]">
            Horizontal divider — no content needed.
          </p>
        );
      case "cta":
        return (
          <>
            {field("heading", "CTA heading…")}
            {field("subheading", "Optional subheading…")}
            {field("button", "Button label")}
            {field("url", "Destination URL")}
          </>
        );
      case "video":
        return (
          <>
            {field("url", "YouTube or Vimeo URL")}
            {field("caption", "Caption (optional)")}
          </>
        );
      case "html":
        return <>{field("code", "<!-- Paste HTML here… -->", 6)}</>;
      default:
        return null;
    }
  };

  return (
    <div className="group/block overflow-hidden rounded-[12px] border border-[#E8E6E1] bg-white">
      <div className="flex items-center gap-2 border-b border-[#E8E6E1] bg-[#FCFBF9] px-4 py-2.5">
        <GripVertical size={14} className="cursor-grab text-[#B2ADA3]" />
        <span className="flex-1 text-[12px] font-semibold text-[#1A1A18]">{block.label}</span>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-[11px] text-[#7A776F] transition-colors hover:text-[#C8924A]"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-[#8B8A86] transition-all hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {!collapsed && <div className="flex flex-col gap-3 p-4">{renderFields()}</div>}
    </div>
  );
}

interface CmsPageEditorProps {
  isEdit?: boolean;
}

export function CmsPageEditor({ isEdit = false }: CmsPageEditorProps) {
  const [title, setTitle] = useState(isEdit ? "Our Showroom" : "");
  const [slug, setSlug] = useState(isEdit ? "/showroom" : "/");
  const [template, setTemplate] = useState<PageTemplate>("default");
  const [status, setStatus] = useState<PageStatus>("draft");
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    isEdit
      ? [
          { id: "b1", type: "hero", label: "Hero Banner", content: defaultContent("hero") },
          { id: "b2", type: "text", label: "Rich Text", content: defaultContent("text") },
          { id: "b3", type: "image", label: "Image", content: defaultContent("image") },
        ]
      : [],
  );
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addBlock = (type: BlockType, label: string) => {
    setBlocks((p) => [...p, { id: uid(), type, label, content: defaultContent(type) }]);
    setShowPicker(false);
  };

  const updateBlock = (id: string, content: Record<string, string>) =>
    setBlocks((p) => p.map((b) => (b.id === id ? { ...b, content } : b)));

  const deleteBlock = (id: string) => setBlocks((p) => p.filter((b) => b.id !== id));

  const handleSave = async (s: PageStatus = status) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setStatus(s);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const selectCls =
    "appearance-none w-full h-9 rounded-[9px] border border-[#D9D5CD] bg-white px-3 pr-7 text-[12.5px] text-[#2B2A28] focus:outline-none focus:border-[#C8924A]/50 transition-colors";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/content/pages"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E8E6E1] bg-[#FCFBF9] text-[#8B8A86] transition-colors hover:text-[#C8924A]"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-[17px] font-bold text-[#1A1A18]">
              {isEdit ? "Edit Page" : "New Page"}
            </h1>
            <p className="mt-0.5 font-mono text-[11.5px] text-[#7A776F]">{slug || "/"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-[9px] border border-[#E8E6E1] bg-[#FCFBF9] px-3 text-[12px] text-[#6B6B68] transition-all hover:border-[#C8924A]/40 hover:text-[#C8924A]">
            <Eye size={13} /> Preview
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-[9px] border border-[#E8E6E1] bg-[#FCFBF9] px-3 text-[12px] text-[#6B6B68] transition-all hover:border-[#C8924A]/40 hover:text-[#C8924A] disabled:opacity-50"
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
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit)
                  setSlug("/" + e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              placeholder="Page title…"
              className="mb-3 w-full border-b border-[#E8E6E1] bg-transparent pb-3 text-[22px] font-bold text-[#1A1A18] placeholder:text-[#8B8A86] focus:outline-none"
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

          <div className="flex flex-col gap-3">
            {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-[#E8E6E1] py-14 text-center">
                <Columns size={24} className="text-[#B2ADA3]" />
                <p className="text-[13px] font-medium text-[#7A776F]">No blocks yet</p>
                <p className="text-[12px] text-[#8A877F]">Add your first content block below</p>
              </div>
            )}
            {blocks.map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
              />
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[#D9D5CD] text-[12.5px] text-[#6B6B68] transition-all hover:border-[#C8924A]/50 hover:bg-[#FCFBF9] hover:text-[#C8924A]"
            >
              <Plus size={15} /> Add Block
            </button>
            {showPicker && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[14px] border border-[#E8E6E1] bg-white p-4 shadow-2xl">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A877F]">
                  Choose a block
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BLOCK_TYPES.map(({ type, label, icon: Icon, desc }) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type, label)}
                      className="group/btn flex flex-col items-start gap-1.5 rounded-[10px] border border-[#E8E6E1] bg-[#FCFBF9] px-3 py-3 text-left transition-all hover:border-[#C8924A]/40 hover:bg-white"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#C8924A]/15 transition-all group-hover/btn:bg-[#C8924A]">
                        <Icon
                          size={14}
                          className="text-[#C8924A] transition-colors group-hover/btn:text-white"
                        />
                      </div>
                      <p className="text-[12px] font-semibold text-[#1A1A18]">{label}</p>
                      <p className="text-[10.5px] leading-tight text-[#8A877F]">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-[#1A1A18]">Page Settings</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="page-status"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8A877F]"
                >
                  Status
                </label>
                <div className="relative">
                  <select
                    id="page-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PageStatus)}
                    className={selectCls}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8A86]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="page-template"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8A877F]"
                >
                  Template
                </label>
                <div className="relative">
                  <select
                    id="page-template"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as PageTemplate)}
                    className={selectCls}
                  >
                    {TEMPLATES.map(({ value, label }) => (
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
                <p className="mt-1 text-[11px] text-[#8A877F]">
                  {TEMPLATES.find((t) => t.value === template)?.desc}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-[#1A1A18]">Content Blocks</h3>
            {blocks.length === 0 ? (
              <p className="text-[12px] italic text-[#8A877F]">No blocks added</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {blocks.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-2 text-[12px]">
                    <span className="w-4 text-[10px] text-[#8A877F]">{i + 1}.</span>
                    <CheckCircle size={11} className="shrink-0 text-emerald-400" />
                    <span className="text-[#6B6B68]">{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
