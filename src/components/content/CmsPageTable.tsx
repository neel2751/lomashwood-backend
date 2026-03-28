"use client";

import { useState } from "react";

import Link from "next/link";
import { Copy, ExternalLink, Eye, Globe, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { useCmsPages } from "@/hooks/useCmsPages";
import { cn } from "@/lib/utils";

type PageStatus = "published" | "draft" | "hidden";
type PageTemplate = "default" | "full_width" | "landing" | "product" | "contact";

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  template: PageTemplate;
  status: PageStatus;
  lastEdited: string;
  editedBy: string;
  seoScore: number;
}

const STATUS_CONFIG: Record<PageStatus, { label: string; bg: string; text: string; dot: string }> =
  {
    published: {
      label: "Published",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
    hidden: { label: "Hidden", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  };

const TEMPLATE_LABELS: Record<PageTemplate, string> = {
  default: "Default",
  full_width: "Full Width",
  landing: "Landing",
  product: "Product",
  contact: "Contact",
};

function SeoIndicator({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-600"
      : score >= 60
        ? "text-[#C8924A]"
        : score >= 40
          ? "text-amber-600"
          : "text-[#8B8A86]";

  const fill =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-[#C8924A]"
        : score >= 40
          ? "bg-amber-500"
          : "bg-[#B2ADA3]";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 max-w-[60px] flex-1 overflow-hidden rounded-full bg-[#ECE9E2]">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("w-7 text-right text-[11px] font-semibold", color)}>
        {score > 0 ? score : "—"}
      </span>
    </div>
  );
}

export function CmsPageTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PageStatus>("All");

  const { data, isLoading, isError } = useCmsPages();

  const pages = ((data as { data?: CmsPage[] } | undefined)?.data ?? []) as CmsPage[];

  const filteredPages = pages.filter((page) => {
    const query = search.toLowerCase();
    const matchesSearch =
      page.title.toLowerCase().includes(query) || page.slug.toLowerCase().includes(query);

    return matchesSearch && (statusFilter === "All" || page.status === statusFilter);
  });

  if (isLoading) {
    return (
      <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-8">
        <p className="text-center text-[#7A776F]">Loading CMS pages...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-8">
        <p className="text-center text-red-600">Failed to load CMS pages.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E6E1] px-5 py-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8A86]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages, slugs…"
            className="h-9 w-[220px] rounded-[9px] border border-[#D9D5CD] bg-white pl-8 pr-3 text-[12.5px] text-[#2B2A28] placeholder:text-[#8B8A86] focus:border-[#C8924A]/50 focus:outline-none"
          />
        </div>

        <div className="flex gap-1 rounded-[8px] border border-[#E8E6E1] bg-[#FCFBF9] p-0.5">
          {(["All", "published", "draft", "hidden"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[11px] font-medium capitalize transition-all",
                statusFilter === status
                  ? "bg-[#C8924A] text-white"
                  : "text-[#6B6B68] hover:text-[#C8924A]",
              )}
            >
              {status === "All" ? "All" : STATUS_CONFIG[status as PageStatus].label}
            </button>
          ))}
        </div>

        <Link
          href="/content/pages/new"
          className="ml-auto flex h-9 items-center gap-2 rounded-[9px] bg-[#C8924A] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#B87E3E]"
        >
          <Plus size={14} /> New Page
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-[#E8E6E1]">
              {["Page Title", "URL", "Template", "SEO", "Status", "Last Edited", "By", ""].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A877F]"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEE9]">
            {filteredPages.map((page) => {
              const status = STATUS_CONFIG[page.status];
              return (
                <tr key={page.id} className="group transition-colors hover:bg-[#FCFBF9]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="shrink-0 text-[#8B8A86]" />
                      <Link
                        href={`/content/pages/${page.id}`}
                        className="text-[13px] font-semibold text-[#1A1A18] transition-colors hover:text-[#8B6914]"
                      >
                        {page.title}
                      </Link>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[11.5px] text-[#7A776F]">{page.slug}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="rounded-full border border-[#E8E6E1] bg-[#F5F3EF] px-2 py-0.5 text-[11px] text-[#6B6B68]">
                      {TEMPLATE_LABELS[page.template]}
                    </span>
                  </td>

                  <td className="min-w-[110px] px-4 py-3.5">
                    <SeoIndicator score={page.seoScore} />
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                        status.bg,
                        status.text,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="whitespace-nowrap text-[11px] text-[#7A776F]">
                      {page.lastEdited}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-[11.5px] text-[#6B6B68]">{page.editedBy}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/content/pages/${page.id}/edit`}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-[#F5F3EF] hover:text-[#C8924A]"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </Link>
                      <Link
                        href={`/content/pages/${page.id}`}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-[#F5F3EF] hover:text-[#C8924A]"
                        title="Preview"
                      >
                        <Eye size={13} />
                      </Link>
                      <a
                        href={page.slug}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-[#F5F3EF] hover:text-[#C8924A]"
                        title="View Live"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-[#F5F3EF] hover:text-[#C8924A]"
                        title="Duplicate"
                      >
                        <Copy size={13} />
                      </button>
                      {page.slug !== "/" && (
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
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

      <div className="flex items-center justify-between border-t border-[#E8E6E1] px-5 py-3">
        <span className="text-[12px] text-[#7A776F]">{filteredPages.length} pages</span>
        <span className="text-[12px] text-[#8A877F]">
          {pages.filter((page) => page.status === "published").length} live ·{" "}
          {pages.filter((page) => page.status === "draft").length} draft
        </span>
      </div>
    </div>
  );
}
