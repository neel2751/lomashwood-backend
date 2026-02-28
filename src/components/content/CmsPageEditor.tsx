"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, Eye, ExternalLink,
  Plus, Trash2, GripVertical, ChevronDown,
  Type, Image, Columns, Quote, Minus,
  Code, Video, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageStatus   = "published" | "draft" | "hidden";
type PageTemplate = "default" | "full_width" | "landing" | "product" | "contact";
type BlockType    = "hero" | "text" | "image" | "columns" | "quote" | "divider" | "cta" | "video" | "html";

interface ContentBlock {
  id: string;
  type: BlockType;
  label: string;
  content: Record<string, string>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "hero",    label: "Hero",          icon: Type,    desc: "Full-width banner with heading & CTA" },
  { type: "text",    label: "Rich Text",     icon: Type,    desc: "Paragraphs, headings, lists"          },
  { type: "image",   label: "Image",         icon: Image,   desc: "Single image with caption"            },
  { type: "columns", label: "Two Columns",   icon: Columns, desc: "Side-by-side content blocks"          },
  { type: "quote",   label: "Pull Quote",    icon: Quote,   desc: "Highlighted quote block"              },
  { type: "divider", label: "Divider",       icon: Minus,   desc: "Horizontal rule"                     },
  { type: "cta",     label: "Call to Action",icon: Type,    desc: "Button block with heading"            },
  { type: "video",   label: "Video",         icon: Video,   desc: "Embedded video"                      },
  { type: "html",    label: "Custom HTML",   icon: Code,    desc: "Raw HTML / embed code"                },
];

const TEMPLATES: { value: PageTemplate; label: string; desc: string }[] = [
  { value: "default",    label: "Default",    desc: "Standard page with sidebar-safe width" },
  { value: "full_width", label: "Full Width", desc: "Edge-to-edge layout, no gutters"       },
  { value: "landing",    label: "Landing",    desc: "No header nav — focused conversion"    },
  { value: "product",    label: "Product",    desc: "Product range layout with filters"     },
  { value: "contact",    label: "Contact",    desc: "Contact form integrated template"      },
];

function uid() { return Math.random().toString(36).slice(2, 8); }

function defaultContent(type: BlockType): Record<string, string> {
  const map: Record<BlockType, Record<string, string>> = {
    hero:    { heading: "Discover Luxury Living", subheading: "Premium kitchens & bedrooms, crafted in Britain.", cta: "Book a Consultation", image: "" },
    text:    { content: "Enter your content here…" },
    image:   { src: "", alt: "", caption: "" },
    columns: { left: "Left column content…", right: "Right column content…" },
    quote:   { quote: "Enter your pull quote…", attribution: "Name, Title" },
    divider: {},
    cta:     { heading: "Ready to Transform Your Home?", subheading: "", button: "Book Now", url: "/book" },
    video:   { url: "", caption: "" },
    html:    { code: "<!-- custom HTML -->" },
  };
  return map[type];
}

function BlockEditor({ block, onUpdate, onDelete }: {
  block: ContentBlock;
  onUpdate: (id: string, content: Record<string, string>) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const inputCls = "w-full h-9 px-3 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors";
  const textareaCls = "w-full px-3 py-2.5 rounded-[8px] bg-[#1C1611] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none";

  const field = (key: string, placeholder: string, rows?: number) => (
    <div key={key}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1 capitalize">{key.replace("_", " ")}</label>
      {rows
        ? <textarea value={block.content[key] ?? ""} onChange={(e) => onUpdate(block.id, { ...block.content, [key]: e.target.value })}
            placeholder={placeholder} rows={rows} className={textareaCls} />
        : <input value={block.content[key] ?? ""} onChange={(e) => onUpdate(block.id, { ...block.content, [key]: e.target.value })}
            placeholder={placeholder} className={inputCls} />
      }
    </div>
  );

  const renderFields = () => {
    switch (block.type) {
      case "hero":    return <>{field("heading","Main heading…")}{field("subheading","Subheading…")}{field("cta","Button label")}{field("image","Image URL or path")}</>;
      case "text":    return <>{field("content","Write your content…", 6)}</>;
      case "image":   return <>{field("src","Image URL or upload path")}{field("alt","Alt text (accessibility)")}{field("caption","Caption (optional)")}</>;
      case "columns": return <div className="grid grid-cols-2 gap-3">{field("left","Left column…",4)}{field("right","Right column…",4)}</div>;
      case "quote":   return <>{field("quote","Enter quote text…", 3)}{field("attribution","Author, Role")}</>;
      case "divider": return <p className="text-[12px] text-[#3D2E1E] italic">Horizontal divider — no content needed.</p>;
      case "cta":     return <>{field("heading","CTA heading…")}{field("subheading","Optional subheading…")}{field("button","Button label")}{field("url","Destination URL")}</>;
      case "video":   return <>{field("url","YouTube or Vimeo URL")}{field("caption","Caption (optional)")}</>;
      case "html":    return <>{field("code","<!-- Paste HTML here… -->", 6)}</>;
      default:        return null;
    }
  };

  return (
    <div className="rounded-[12px] bg-[#1C1611] border border-[#2E231A] overflow-hidden group/block">
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1A100C] border-b border-[#2E231A]">
        <GripVertical size={14} className="text-[#3D2E1E] cursor-grab" />
        <span className="flex-1 text-[12px] font-semibold text-[#C8B99A]">{block.label}</span>
        <button onClick={() => setCollapsed((v) => !v)}
          className="text-[11px] text-[#5A4232] hover:text-[#C8924A] transition-colors">
          {collapsed ? "Expand" : "Collapse"}
        </button>
        <button onClick={() => onDelete(block.id)}
          className="w-6 h-6 flex items-center justify-center rounded-[5px] text-[#3D2E1E] hover:text-red-400 hover:bg-red-400/10 transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-3">
          {renderFields()}
        </div>
      )}
    </div>
  );
}

interface CmsPageEditorProps { pageId?: string; isEdit?: boolean; }

export function CmsPageEditor({ pageId, isEdit = false }: CmsPageEditorProps) {
  const [title,    setTitle]    = useState(isEdit ? "Our Showroom" : "");
  const [slug,     setSlug]     = useState(isEdit ? "/showroom" : "/");
  const [template, setTemplate] = useState<PageTemplate>("default");
  const [status,   setStatus]   = useState<PageStatus>("draft");
  const [blocks,   setBlocks]   = useState<ContentBlock[]>(
    isEdit ? [
      { id: "b1", type: "hero",  label: "Hero Banner",  content: defaultContent("hero") },
      { id: "b2", type: "text",  label: "Rich Text",    content: defaultContent("text") },
      { id: "b3", type: "image", label: "Image",        content: defaultContent("image") },
    ] : []
  );
  const [showBlockPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const addBlock = (type: BlockType, label: string) => {
    setBlocks((p) => [...p, { id: uid(), type, label, content: defaultContent(type) }]);
    setShowPicker(false);
  };

  const updateBlock = (id: string, content: Record<string, string>) =>
    setBlocks((p) => p.map((b) => b.id === id ? { ...b, content } : b));

  const deleteBlock = (id: string) =>
    setBlocks((p) => p.filter((b) => b.id !== id));

  const handleSave = async (s: PageStatus = status) => {
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
          <Link href="/content/pages"
            className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] hover:text-[#C8924A] transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-[17px] font-bold text-[#E8D5B7]">{isEdit ? "Edit Page" : "New Page"}</h1>
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
          <button onClick={() => handleSave("published")} disabled={saving || !title}
            className={cn("flex items-center gap-2 h-9 px-4 rounded-[9px] text-[12.5px] font-medium transition-all disabled:opacity-50",
              saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#C8924A] text-white hover:bg-[#B87E3E]")}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            {saved ? "Published!" : saving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main: blocks */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Title + slug */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <input value={title} onChange={(e) => { setTitle(e.target.value); if (!isEdit) setSlug("/" + e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }}
              placeholder="Page title…"
              className="w-full bg-transparent text-[22px] font-bold text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none border-b border-[#2E231A] pb-3 mb-3" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#3D2E1E] font-mono shrink-0">lomashwood.co.uk</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent text-[11.5px] font-mono text-[#5A4232] focus:outline-none focus:text-[#C8924A] transition-colors" />
            </div>
          </div>

          {/* Content blocks */}
          <div className="flex flex-col gap-3">
            {blocks.length === 0 && (
              <div className="rounded-[16px] border-2 border-dashed border-[#2E231A] py-14 flex flex-col items-center justify-center gap-2 text-center">
                <Columns size={24} className="text-[#3D2E1E]" />
                <p className="text-[13px] font-medium text-[#5A4232]">No blocks yet</p>
                <p className="text-[12px] text-[#3D2E1E]">Add your first content block below</p>
              </div>
            )}
            {blocks.map((block) => (
              <BlockEditor key={block.id} block={block} onUpdate={updateBlock} onDelete={deleteBlock} />
            ))}
          </div>

          {/* Add block */}
          <div className="relative">
            <button onClick={() => setShowPicker((v) => !v)}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-[12px] border-2 border-dashed border-[#3D2E1E] text-[12.5px] text-[#5A4232] hover:border-[#C8924A]/50 hover:text-[#C8924A] hover:bg-[#221A12] transition-all">
              <Plus size={15} /> Add Block
            </button>
            {showPicker && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-20 bg-[#1C1611] border border-[#2E231A] rounded-[14px] shadow-2xl p-4">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E] mb-3">Choose a block</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BLOCK_TYPES.map(({ type, label, icon: Icon, desc }) => (
                    <button key={type} onClick={() => addBlock(type, label)}
                      className="flex flex-col items-start gap-1.5 px-3 py-3 rounded-[10px] bg-[#2E231A] border border-[#3D2E1E] hover:border-[#C8924A]/40 hover:bg-[#221A12] text-left transition-all group/btn">
                      <div className="w-8 h-8 rounded-[8px] bg-[#C8924A]/15 flex items-center justify-center group-hover/btn:bg-[#C8924A] transition-all">
                        <Icon size={14} className="text-[#C8924A] group-hover/btn:text-white transition-colors" />
                      </div>
                      <p className="text-[12px] font-semibold text-[#C8B99A]">{label}</p>
                      <p className="text-[10.5px] text-[#3D2E1E] leading-tight">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: page settings */}
        <div className="flex flex-col gap-4">
          {/* Page settings */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-4">Page Settings</h3>
            <div className="flex flex-col gap-3">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Status</label>
                <div className="relative">
                  <select value={status} onChange={(e) => setStatus(e.target.value as PageStatus)} className={selectCls}>
                    <option value="draft"     className="bg-[#1C1611]">Draft</option>
                    <option value="published" className="bg-[#1C1611]">Published</option>
                    <option value="hidden"    className="bg-[#1C1611]">Hidden</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E] mb-1">Template</label>
                <div className="relative">
                  <select value={template} onChange={(e) => setTemplate(e.target.value as PageTemplate)} className={selectCls}>
                    {TEMPLATES.map(({ value, label }) => (
                      <option key={value} value={value} className="bg-[#1C1611]">{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#3D2E1E] mt-1">
                  {TEMPLATES.find((t) => t.value === template)?.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Block count summary */}
          <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
            <h3 className="text-[13px] font-semibold text-[#E8D5B7] mb-3">Content Blocks</h3>
            {blocks.length === 0 ? (
              <p className="text-[12px] text-[#3D2E1E] italic">No blocks added</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {blocks.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-2 text-[12px]">
                    <span className="text-[10px] text-[#3D2E1E] w-4">{i + 1}.</span>
                    <CheckCircle size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-[#7A6045]">{b.label}</span>
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