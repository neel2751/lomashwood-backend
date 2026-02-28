"use client";

import { useState } from "react";

import { ArrowUpDown, ExternalLink, Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface TrackingEvent {
  id: string;
  event: string;
  category: "page_view" | "click" | "form" | "conversion" | "scroll";
  page: string;
  count: number;
  uniqueUsers: number;
  conversionRate: number;
  lastTriggered: string;
}

const MOCK_EVENTS: TrackingEvent[] = [
  { id: "1",  event: "page_view",               category: "page_view",  page: "/",                   count: 12840, uniqueUsers: 8620,  conversionRate: 0,    lastTriggered: "2m ago"   },
  { id: "2",  event: "book_appointment_click",   category: "click",      page: "/",                   count: 3210,  uniqueUsers: 2840,  conversionRate: 22.1, lastTriggered: "5m ago"   },
  { id: "3",  event: "page_view",               category: "page_view",  page: "/kitchens",            count: 9420,  uniqueUsers: 6310,  conversionRate: 0,    lastTriggered: "1m ago"   },
  { id: "4",  event: "product_detail_view",      category: "page_view",  page: "/kitchens/luna-white", count: 4820,  uniqueUsers: 3910,  conversionRate: 0,    lastTriggered: "3m ago"   },
  { id: "5",  event: "brochure_request_submit",  category: "form",       page: "/brochure",            count: 892,   uniqueUsers: 882,   conversionRate: 18.4, lastTriggered: "22m ago"  },
  { id: "6",  event: "appointment_submit",       category: "conversion", page: "/book-appointment",    count: 641,   uniqueUsers: 638,   conversionRate: 34.2, lastTriggered: "14m ago"  },
  { id: "7",  event: "colour_filter_applied",    category: "click",      page: "/kitchens",            count: 5640,  uniqueUsers: 3820,  conversionRate: 0,    lastTriggered: "8m ago"   },
  { id: "8",  event: "finance_page_scroll_50",   category: "scroll",     page: "/finance",             count: 2100,  uniqueUsers: 1840,  conversionRate: 0,    lastTriggered: "17m ago"  },
  { id: "9",  event: "showroom_find_click",      category: "click",      page: "/find-a-showroom",     count: 1820,  uniqueUsers: 1540,  conversionRate: 0,    lastTriggered: "9m ago"   },
  { id: "10", event: "business_enquiry_submit",  category: "form",       page: "/business-with-us",    count: 124,   uniqueUsers: 124,   conversionRate: 0,    lastTriggered: "2h ago"   },
];

const CATEGORY_STYLES: Record<TrackingEvent["category"], string> = {
  page_view:  "bg-[#6B8A9A]/15 text-[#6B8A9A]",
  click:      "bg-[#C8924A]/15 text-[#C8924A]",
  form:       "bg-emerald-400/10 text-emerald-400",
  conversion: "bg-purple-400/10 text-purple-400",
  scroll:     "bg-[#8B6B4A]/15 text-[#C8B99A]",
};

type SortKey = "count" | "uniqueUsers" | "conversionRate";

export function TrackingTable() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = MOCK_EVENTS
    .filter(
      (e) =>
        e.event.toLowerCase().includes(search.toLowerCase()) ||
        e.page.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );

  const SortBtn = ({ col }: { col: SortKey }) => (
    <button
      onClick={() => handleSort(col)}
      className="ml-1 text-[#3D2E1E] hover:text-[#C8924A] transition-colors"
    >
      <ArrowUpDown size={11} className={cn(sortKey === col && "text-[#C8924A]")} />
    </button>
  );

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E8D5B7]">Event Tracking</h3>
          <p className="text-[12px] text-[#5A4232] mt-0.5">GTM-fired analytics events</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="h-8 pl-8 pr-3 rounded-[8px] bg-[#2E231A] border border-[#3D2E1E] text-[12px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[180px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr>
              {[
                { label: "Event", key: null },
                { label: "Category", key: null },
                { label: "Page", key: null },
                { label: "Hits", key: "count" as SortKey },
                { label: "Unique Users", key: "uniqueUsers" as SortKey },
                { label: "Conv. Rate", key: "conversionRate" as SortKey },
                { label: "Last Fired", key: null },
              ].map(({ label, key }) => (
                <th
                  key={label}
                  className="px-2 pb-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E] first:pl-0"
                >
                  {label}
                  {key && <SortBtn col={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((row) => (
              <tr key={row.id} className="group hover:bg-[#221A12] transition-colors">
                <td className="py-3 pr-2 pl-0">
                  <span className="text-[12px] font-mono text-[#C8B99A] group-hover:text-[#E8D5B7] transition-colors">
                    {row.event}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium capitalize", CATEGORY_STYLES[row.category])}>
                    {row.category.replace("_", " ")}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span className="flex items-center gap-1 text-[11.5px] text-[#5A4232] font-mono">
                    {row.page}
                    <ExternalLink size={10} className="text-[#3D2E1E]" />
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span className="text-[12.5px] font-semibold text-[#E8D5B7]">
                    {row.count.toLocaleString()}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span className="text-[12.5px] text-[#9A7A5A]">
                    {row.uniqueUsers.toLocaleString()}
                  </span>
                </td>
                <td className="px-2 py-3">
                  {row.conversionRate > 0 ? (
                    <span className="text-[12px] font-semibold text-emerald-400">
                      {row.conversionRate}%
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#3D2E1E]">—</span>
                  )}
                </td>
                <td className="px-2 py-3">
                  <span className="text-[11px] text-[#5A4232]">{row.lastTriggered}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}