"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Search, Plus, Pencil, Eye, Copy,
  ExternalLink, Trash2, Globe,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PageStatus   = "published" | "draft" | "hidden";
type PageTemplate = "default" | "full_width" | "landing" | "product" | "contact";

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  template: PageTemplate;
  status: PageStatus;
  lastEdited: string;
  editedBy: string;
  seoScore: number; // 0-100
}

const MOCK_PAGES: CmsPage[] = [
  { id: "1",  title: "Home",                    slug: "/",                          template: "full_width", status: "published", lastEdited: "15 Feb 2026", editedBy: "Sarah Alderton", seoScore: 92 },
  { id: "2",  title: "About Us",                slug: "/about",                     template: "default",    status: "published", lastEdited: "10 Jan 2026", editedBy: "Admin",          seoScore: 78 },
  { id: "3",  title: "Kitchen Range",           slug: "/kitchen",                   template: "product",    status: "published", lastEdited: "20 Feb 2026", editedBy: "Marcus Webb",    seoScore: 88 },
  { id: "4",  title: "Bedroom Range",           slug: "/bedroom",                   template: "product",    status: "published", lastEdited: "20 Feb 2026", editedBy: "Marcus Webb",    seoScore: 85 },
  { id: "5",  title: "Our Showroom",            slug: "/showroom",                  template: "default",    status: "published", lastEdited: "05 Feb 2026", editedBy: "Admin",          seoScore: 74 },
  { id: "6",  title: "Book a Consultation",     slug: "/book",                      template: "contact",    status: "published", lastEdited: "28 Jan 2026", editedBy: "Jade Nguyen",    seoScore: 81 },
  { id: "7",  title: "Contact Us",              slug: "/contact",                   template: "contact",    status: "published", lastEdited: "01 Jan 2026", editedBy: "Admin",          seoScore: 70 },
  { id: "8",  title: "Privacy Policy",          slug: "/privacy",                   template: "default",    status: "published", lastEdited: "01 Jan 2026", editedBy: "Admin",          seoScore: 55 },
  { id: "9",  title: "Sustainability",          slug: "/sustainability",             template: "default",    status: "draft",     lastEdited: "25 Feb 2026", editedBy: "Sarah Alderton", seoScore: 40 },
  { id: "10", title: "Trade Programme",         slug: "/trade",                     template: "landing",    status: "draft",     lastEdited: "22 Feb 2026", editedBy: "Marcus Webb",    seoScore: 0  },
  { id: "11", title: "Old Promotions Archive",  slug: "/promotions-2025",           template: "default",    status: "hidden",    lastEdited: "01 Dec 2025", editedBy: "Admin",          seoScore: 35 },
];

const STATUS_CONFIG: Record<PageStatus, { label: string; bg: string; text: string; dot: string }> = {
  published: { label: "Published", bg: "bg-emerald-400/10",  text: "text-emerald-400", dot: "bg-emerald-400" },
  draft:     { label: "Draft",     bg: "bg-[#3D2E1E]",       text: "text-[#5A4232]",   dot: "bg-[#5A4232]"   },
  hidden:    { label: "Hidden",    bg: "bg-amber-400/10",    text: "text-amber-400",   dot: "bg-amber-400"   },
};

const TEMPLATE_LABELS: Record<PageTemplate, string> = {
  default:    "Default",
  full_width: "Full Width",
  landing:    "Landing",
  product:    "Product",
  contact:    "Contact",
};

function SeoIndicator({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-400" :
    score >= 60 ? "text-[#C8924A]"   :
    score >= 40 ? "text-amber-400"   : "text-[#5A4232]";
  const fill  =
    score >= 80 ? "bg-emerald-400" :
    score >= 60 ? "bg-[#C8924A]"   :
    score >= 40 ? "bg-amber-400"   : "bg-[#5A4232]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#2E231A] overflow-hidden max-w-[60px]">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-[11px] font-semibold w-7 text-right", color)}>
        {score > 0 ? score : "—"}
      </span>
    </div>
  );
}

export function CmsPageTable() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<"All" | PageStatus>("All");

  const filtered = MOCK_PAGES.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    return matchSearch && (statusFilter === "All" || p.status === statusFilter);
  });

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages, slugs…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]" />
        </div>

        <div className="flex gap-1 bg-[#2E231A] rounded-[8px] p-0.5">
          {(["All","published","draft","hidden"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("px-3 py-1 rounded-[6px] text-[11px] font-medium capitalize transition-all",
                statusFilter === s ? "bg-[#C8924A] text-white" : "text-[#5A4232] hover:text-[#C8924A]")}>
              {s === "All" ? "All" : STATUS_CONFIG[s as PageStatus].label}
            </button>
          ))}
        </div>

        <Link href="/content/pages/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={14} /> New Page
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Page Title","URL","Template","SEO","Status","Last Edited","By",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((page) => {
              const st = STATUS_CONFIG[page.status];
              return (
                <tr key={page.id} className="group hover:bg-[#221A12] transition-colors">
                  {/* Title */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-[#5A4232] shrink-0" />
                      <Link href={`/content/pages/${page.id}`}
                        className="text-[13px] font-semibold text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">
                        {page.title}
                      </Link>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11.5px] font-mono text-[#5A4232]">{page.slug}</span>
                  </td>

                  {/* Template */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232]">
                      {TEMPLATE_LABELS[page.template]}
                    </span>
                  </td>

                  {/* SEO */}
                  <td className="px-4 py-3.5 min-w-[110px]">
                    <SeoIndicator score={page.seoScore} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", st.bg, st.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                      {st.label}
                    </span>
                  </td>

                  {/* Last edited */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] text-[#5A4232] whitespace-nowrap">{page.lastEdited}</span>
                  </td>

                  {/* Edited by */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11.5px] text-[#7A6045]">{page.editedBy}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/content/pages/${page.id}/edit`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="Edit">
                        <Pencil size={13} />
                      </Link>
                      <Link href={`/content/pages/${page.id}`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="Preview">
                        <Eye size={13} />
                      </Link>
                      <a href={page.slug} target="_blank" rel="noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="View Live">
                        <ExternalLink size={13} />
                      </a>
                      <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="Duplicate">
                        <Copy size={13} />
                      </button>
                      {page.slug !== "/" && (
                        <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A] flex items-center justify-between">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} pages</span>
        <span className="text-[12px] text-[#3D2E1E]">
          {MOCK_PAGES.filter((p) => p.status === "published").length} live ·{" "}
          {MOCK_PAGES.filter((p) => p.status === "draft").length} draft
        </span>
      </div>
    </div>
  );
}