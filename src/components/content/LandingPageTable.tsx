"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Plus, Pencil, Eye, Copy,
  ExternalLink, Trash2, ChevronDown,
  TrendingUp, Target, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LandingStatus = "live" | "draft" | "paused" | "archived";

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  campaign: string;
  status: LandingStatus;
  visits: number;
  conversions: number;
  createdAt: string;
  expiresAt?: string;
  lastEdited: string;
}

const MOCK_PAGES: LandingPage[] = [
  { id: "1", title: "Spring Kitchen Sale 2026",       slug: "/kitchen-spring-sale",       campaign: "Spring Sale",    status: "live",     visits: 3421, conversions: 184, createdAt: "01 Feb 2026", expiresAt: "31 Mar 2026", lastEdited: "10 Feb 2026" },
  { id: "2", title: "Book a Free Home Consultation",  slug: "/free-consultation",         campaign: "Lead Gen",       status: "live",     visits: 1892, conversions: 97,  createdAt: "15 Jan 2026", lastEdited: "20 Jan 2026" },
  { id: "3", title: "Trade Programme Sign Up",        slug: "/trade-programme",           campaign: "Trade",          status: "draft",    visits: 0,    conversions: 0,   createdAt: "20 Feb 2026", lastEdited: "27 Feb 2026" },
  { id: "4", title: "Bedroom Range Launch",           slug: "/bedroom-launch-2026",       campaign: "Bedroom Launch", status: "live",     visits: 2109, conversions: 131, createdAt: "01 Feb 2026", expiresAt: "28 Feb 2026", lastEdited: "01 Feb 2026" },
  { id: "5", title: "Christmas Kitchens 2025",        slug: "/christmas-kitchens-2025",   campaign: "Christmas 2025", status: "archived", visits: 4872, conversions: 289, createdAt: "01 Nov 2025", expiresAt: "31 Dec 2025", lastEdited: "01 Nov 2025" },
  { id: "6", title: "Manchester Showroom Open Day",   slug: "/showroom-open-day",         campaign: "Events",         status: "paused",   visits: 742,  conversions: 58,  createdAt: "05 Feb 2026", expiresAt: "15 Feb 2026", lastEdited: "05 Feb 2026" },
  { id: "7", title: "Sustainability Promise Page",    slug: "/sustainability-promise",    campaign: "Brand",          status: "draft",    visits: 0,    conversions: 0,   createdAt: "25 Feb 2026", lastEdited: "25 Feb 2026" },
];

const STATUS_CONFIG: Record<LandingStatus, { label: string; bg: string; text: string; dot: string }> = {
  live:     { label: "Live",     bg: "bg-emerald-400/10",  text: "text-emerald-400", dot: "bg-emerald-400" },
  draft:    { label: "Draft",    bg: "bg-[#3D2E1E]",       text: "text-[#5A4232]",   dot: "bg-[#5A4232]"   },
  paused:   { label: "Paused",   bg: "bg-amber-400/10",    text: "text-amber-400",   dot: "bg-amber-400"   },
  archived: { label: "Archived", bg: "bg-[#2E231A]",       text: "text-[#3D2E1E]",   dot: "bg-[#3D2E1E]"  },
};

function ConversionRate({ visits, conversions }: { visits: number; conversions: number }) {
  if (visits === 0) return <span className="text-[12px] text-[#3D2E1E]">—</span>;
  const rate = ((conversions / visits) * 100).toFixed(1);
  const color = parseFloat(rate) >= 8 ? "text-emerald-400" : parseFloat(rate) >= 4 ? "text-[#C8924A]" : "text-amber-400";
  return (
    <div className="flex items-center gap-1">
      <TrendingUp size={11} className={color} />
      <span className={cn("text-[12.5px] font-semibold", color)}>{rate}%</span>
    </div>
  );
}

export function LandingPageTable() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<"All" | LandingStatus>("All");
  const [statuses, setStatuses]   = useState<Record<string, LandingStatus>>(
    Object.fromEntries(MOCK_PAGES.map((p) => [p.id, p.status]))
  );

  const filtered = MOCK_PAGES.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.campaign.toLowerCase().includes(q);
    return matchSearch && (statusFilter === "All" || statuses[p.id] === statusFilter);
  });

  const toggleStatus = (id: string, current: LandingStatus) => {
    const next = current === "live" ? "paused" : current === "paused" ? "live" : current;
    if (next !== current) setStatuses((p) => ({ ...p, [id]: next }));
  };

  const totalVisits      = MOCK_PAGES.reduce((s, p) => s + p.visits, 0);
  const totalConversions = MOCK_PAGES.reduce((s, p) => s + p.conversions, 0);

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-[#2E231A] border-b border-[#2E231A] bg-[#1A100C]">
        {[
          { label: "Total Visits",      value: totalVisits.toLocaleString(),      icon: Eye       },
          { label: "Total Conversions", value: totalConversions.toLocaleString(), icon: Target    },
          { label: "Avg. Conv. Rate",   value: totalVisits > 0 ? `${((totalConversions/totalVisits)*100).toFixed(1)}%` : "—", icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-3">
            <Icon size={14} className="text-[#C8924A]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E]">{label}</p>
              <p className="text-[15px] font-bold text-[#E8D5B7]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages, campaigns…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[210px]" />
        </div>

        <div className="flex gap-1 bg-[#2E231A] rounded-[8px] p-0.5">
          {(["All","live","draft","paused","archived"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("px-3 py-1 rounded-[6px] text-[11px] font-medium capitalize transition-all",
                statusFilter === s ? "bg-[#C8924A] text-white" : "text-[#5A4232] hover:text-[#C8924A]")}>
              {s === "All" ? "All" : STATUS_CONFIG[s as LandingStatus].label}
            </button>
          ))}
        </div>

        <Link href="/content/landing/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <Plus size={14} /> New Landing Page
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Page","Campaign","Status","Visits","Conv.","Conv. Rate","Expires",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((page) => {
              const currentStatus = statuses[page.id] as LandingStatus;
              const st = STATUS_CONFIG[currentStatus];
              const isExpired = page.expiresAt && new Date(page.expiresAt) < new Date();

              return (
                <tr key={page.id} className="group hover:bg-[#221A12] transition-colors">
                  {/* Page */}
                  <td className="px-4 py-3.5 max-w-[220px]">
                    <Link href={`/content/landing/${page.id}`}
                      className="text-[13px] font-semibold text-[#C8B99A] hover:text-[#E8D5B7] transition-colors block line-clamp-1">
                      {page.title}
                    </Link>
                    <p className="text-[11px] font-mono text-[#5A4232] mt-0.5">{page.slug}</p>
                  </td>

                  {/* Campaign */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-[#2E231A] border border-[#3D2E1E] text-[#7A6045]">
                      {page.campaign}
                    </span>
                  </td>

                  {/* Status + toggle */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", st.bg, st.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                        {st.label}
                      </span>
                      {(currentStatus === "live" || currentStatus === "paused") && (
                        <button onClick={() => toggleStatus(page.id, currentStatus)}
                          className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all",
                            currentStatus === "live"
                              ? "border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                              : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
                          )}>
                          {currentStatus === "live" ? "Pause" : "Resume"}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Visits */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Eye size={11} className="text-[#5A4232]" />
                      <span className="text-[12.5px] font-medium text-[#E8D5B7]">{page.visits.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Conversions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Target size={11} className="text-[#5A4232]" />
                      <span className="text-[12.5px] font-medium text-[#E8D5B7]">{page.conversions.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Conv Rate */}
                  <td className="px-4 py-3.5">
                    <ConversionRate visits={page.visits} conversions={page.conversions} />
                  </td>

                  {/* Expires */}
                  <td className="px-4 py-3.5">
                    {page.expiresAt
                      ? <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar size={10} className={isExpired ? "text-red-400" : "text-[#5A4232]"} />
                          <span className={isExpired ? "text-red-400 font-medium" : "text-[#5A4232]"}>
                            {page.expiresAt}{isExpired ? " (expired)" : ""}
                          </span>
                        </div>
                      : <span className="text-[11px] text-[#3D2E1E]">No expiry</span>
                    }
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/content/landing/${page.id}/edit`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                        <Pencil size={13} />
                      </Link>
                      <Link href={`/content/landing/${page.id}`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                        <Eye size={13} />
                      </Link>
                      <a href={page.slug} target="_blank" rel="noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                        <ExternalLink size={13} />
                      </a>
                      <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                        <Copy size={13} />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={13} />
                      </button>
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
          {MOCK_PAGES.filter((p) => p.status === "live").length} live ·{" "}
          {MOCK_PAGES.filter((p) => p.status === "draft").length} draft
        </span>
      </div>
    </div>
  );
}