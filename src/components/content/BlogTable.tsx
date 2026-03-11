"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Search, Filter, ChevronDown, MoreHorizontal,
  Eye, Pencil, Trash2, Copy, Plus,
  ExternalLink, Calendar, User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useBlogs } from "@/hooks/useBlogs";

export type BlogStatus   = "draft" | "published" | "scheduled" | "archived";
export type BlogCategory = "kitchen" | "bedroom" | "inspiration" | "how_to" | "news" | "case_study";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: BlogCategory;
  status: BlogStatus;
  author: string;
  featuredImage?: string;
  tags: string[];
  publishedAt?: string;
  scheduledFor?: string;
  updatedAt: string;
  readTime: number;
  views: number;
}

const STATUS_CONFIG: Record<BlogStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: "Draft",     bg: "bg-[#3D2E1E]",       text: "text-[#5A4232]",   dot: "bg-[#5A4232]"   },
  published: { label: "Published", bg: "bg-emerald-400/10",  text: "text-emerald-400", dot: "bg-emerald-400" },
  scheduled: { label: "Scheduled", bg: "bg-blue-400/10",     text: "text-blue-400",    dot: "bg-blue-400"    },
  archived:  { label: "Archived",  bg: "bg-[#2E231A]",       text: "text-[#3D2E1E]",   dot: "bg-[#3D2E1E]"  },
};

const CATEGORY_CONFIG: Record<BlogCategory, { label: string; bg: string; text: string }> = {
  kitchen:     { label: "Kitchen",     bg: "bg-[#C8924A]/15",   text: "text-[#C8924A]"  },
  bedroom:     { label: "Bedroom",     bg: "bg-[#6B8A9A]/15",   text: "text-[#6B8A9A]"  },
  inspiration: { label: "Inspiration", bg: "bg-purple-400/10",  text: "text-purple-400" },
  how_to:      { label: "How To",      bg: "bg-teal-400/10",    text: "text-teal-400"   },
  news:        { label: "News",        bg: "bg-amber-400/10",   text: "text-amber-400"  },
  case_study:  { label: "Case Study",  bg: "bg-blue-400/10",    text: "text-blue-400"   },
};

type StatusFilterValue = "All" | BlogStatus;
type CategoryFilterValue = "All" | BlogCategory;

export function BlogTable() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<StatusFilterValue>("All");
  const [catFilter, setCat]       = useState<CategoryFilterValue>("All");
  const [openMenu, setOpenMenu]   = useState<string | null>(null);
  const [selected, setSelected]   = useState<string[]>([]);

  const { data, isLoading, isError } = useBlogs({
    search: search || undefined,
    status: statusFilter === "All" ? undefined : statusFilter,
    category: catFilter === "All" ? undefined : catFilter,
  });

  const posts = ((data as { data?: BlogPost[] } | undefined)?.data ?? []) as BlogPost[];
  const filtered = posts;

  if (isLoading) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden p-8">
        <p className="text-center text-[#5A4232]">Loading blog posts...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden p-8">
        <p className="text-center text-red-400">Failed to load blog posts.</p>
      </div>
    );
  }

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id));

  const totalViews = posts.filter((p) => p.status === "published")
    .reduce((s, p) => s + p.views, 0);

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts, authors…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[210px]"
          />
        </div>

        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as StatusFilterValue)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Status</option>
            {(Object.keys(STATUS_CONFIG) as BlogStatus[]).map((s) => (
              <option key={s} value={s} className="bg-[#1C1611]">{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <div className="relative">
          <select value={catFilter} onChange={(e) => setCat(e.target.value as CategoryFilterValue)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Categories</option>
            {(Object.keys(CATEGORY_CONFIG) as BlogCategory[]).map((c) => (
              <option key={c} value={c} className="bg-[#1C1611]">{CATEGORY_CONFIG[c].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {selected.length > 0 && (
          <span className="text-[11px] text-[#C8924A] bg-[#C8924A]/10 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12px] text-[#5A4232]">
            Total views: <span className="text-[#E8D5B7] font-semibold">{totalViews.toLocaleString()}</span>
          </span>
          <Link href="/content/blog/new"
            className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
            <Plus size={14} /> New Post
          </Link>
        </div>
      </div>


      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              <th className="px-5 py-3 w-10">
                <input type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
              </th>
              {["Post","Category","Author","Status","Read Time","Views","Date",""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((post) => {
              const st  = STATUS_CONFIG[post.status];
              const cat = CATEGORY_CONFIG[post.category];
              return (
                <tr key={post.id} className="group hover:bg-[#221A12] transition-colors">
                  <td className="px-5 py-3.5">
                    <input type="checkbox" checked={selected.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
                  </td>

        
                  <td className="px-3 py-3.5 max-w-[260px]">
                    <Link href={`/content/blog/${post.id}`}
                      className="text-[13px] font-semibold text-[#C8B99A] hover:text-[#E8D5B7] transition-colors line-clamp-1 block">
                      {post.title}
                    </Link>
                    <p className="text-[11px] text-[#5A4232] mt-0.5 font-mono">/{post.slug}</p>
                  </td>

              
                  <td className="px-3 py-3.5">
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", cat.bg, cat.text)}>
                      {cat.label}
                    </span>
                  </td>

                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-[#5A4232]" />
                      <span className="text-[12px] text-[#7A6045] whitespace-nowrap">{post.author}</span>
                    </div>
                  </td>

      
                  <td className="px-3 py-3.5">
                    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", st.bg, st.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                      {st.label}
                    </span>
                  </td>

     
                  <td className="px-3 py-3.5">
                    <span className="text-[12px] text-[#5A4232]">{post.readTime} min</span>
                  </td>

  
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1">
                      <Eye size={11} className="text-[#5A4232]" />
                      <span className="text-[12.5px] font-medium text-[#C8B99A]">{post.views.toLocaleString()}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1">
                      <Calendar size={10} className="text-[#3D2E1E]" />
                      <span className="text-[11px] text-[#5A4232] whitespace-nowrap">
                        {post.publishedAt ?? post.scheduledFor ?? post.updatedAt}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 relative">
                    <button onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === post.id && (
                      <div className="absolute right-3 top-full mt-1 z-20 w-[165px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                        {[
                          { icon: Pencil,      label: "Edit",         href: `/content/blog/${post.id}/edit`  },
                          { icon: Eye,         label: "Preview",      href: `/content/blog/${post.id}`       },
                          { icon: ExternalLink,label: "View Live",    href: `/blog/${post.slug}`             },
                          { icon: Copy,        label: "Duplicate",    href: "#"                              },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link key={label} href={href} onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                            <Icon size={13} /> {label}
                          </Link>
                        ))}
                        <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-red-400 hover:bg-red-400/10 transition-all border-t border-[#2E231A]">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A] flex items-center justify-between">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} posts</span>
        <span className="text-[12px] text-[#3D2E1E]">
          {posts.filter((p) => p.status === "published").length} published ·{" "}
          {posts.filter((p) => p.status === "draft").length} drafts
        </span>
      </div>
    </div>
  );
}