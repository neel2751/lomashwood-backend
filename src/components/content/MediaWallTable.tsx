"use client";

import { useState } from "react";

import {
  Search,
  Filter,
  ChevronDown,
  Upload,
  Trash2,
  Copy,
  Download,
  Image,
  Film,
  FileText,
  Grid,
  List,
  CheckSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";

type MediaType = "image" | "video" | "document";

interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  mimeType: string;
  size: number; // bytes
  width?: number;
  height?: number;
  url: string;
  folder: string;
  uploadedAt: string;
  usedIn: number;
}

const MOCK_MEDIA: MediaItem[] = [
  {
    id: "1",
    name: "luna-white-kitchen-hero.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 1842000,
    width: 2400,
    height: 1600,
    url: "/media/luna-white-kitchen-hero.jpg",
    folder: "products",
    uploadedAt: "10 Feb 2026",
    usedIn: 4,
  },
  {
    id: "2",
    name: "halo-oak-bedroom-overview.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 1240000,
    width: 2400,
    height: 1600,
    url: "/media/halo-oak-bedroom-overview.jpg",
    folder: "products",
    uploadedAt: "10 Feb 2026",
    usedIn: 2,
  },
  {
    id: "3",
    name: "showroom-interior-2026.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 2100000,
    width: 3200,
    height: 2000,
    url: "/media/showroom-interior-2026.jpg",
    folder: "brand",
    uploadedAt: "05 Feb 2026",
    usedIn: 3,
  },
  {
    id: "4",
    name: "kitchen-trends-hero.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 980000,
    width: 1920,
    height: 1080,
    url: "/media/kitchen-trends-hero.jpg",
    folder: "blog",
    uploadedAt: "10 Feb 2026",
    usedIn: 1,
  },
  {
    id: "5",
    name: "lomash-brand-logo.svg",
    type: "image",
    mimeType: "image/svg+xml",
    size: 12000,
    url: "/media/lomash-brand-logo.svg",
    folder: "brand",
    uploadedAt: "01 Jan 2026",
    usedIn: 14,
  },
  {
    id: "6",
    name: "workshop-video-tour.mp4",
    type: "video",
    mimeType: "video/mp4",
    size: 48000000,
    url: "/media/workshop-video-tour.mp4",
    folder: "videos",
    uploadedAt: "15 Jan 2026",
    usedIn: 2,
  },
  {
    id: "7",
    name: "product-catalogue-2026.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: 5200000,
    url: "/media/product-catalogue-2026.pdf",
    folder: "documents",
    uploadedAt: "01 Jan 2026",
    usedIn: 6,
  },
  {
    id: "8",
    name: "slate-grey-kitchen-detail.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 1560000,
    width: 2400,
    height: 1600,
    url: "/media/slate-grey-kitchen-detail.jpg",
    folder: "products",
    uploadedAt: "22 Jan 2026",
    usedIn: 1,
  },
  {
    id: "9",
    name: "thornton-case-study-hero.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 1900000,
    width: 2400,
    height: 1600,
    url: "/media/thornton-case-study-hero.jpg",
    folder: "blog",
    uploadedAt: "05 Feb 2026",
    usedIn: 1,
  },
  {
    id: "10",
    name: "installation-guide.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: 2300000,
    url: "/media/installation-guide.pdf",
    folder: "documents",
    uploadedAt: "20 Jan 2026",
    usedIn: 3,
  },
  {
    id: "11",
    name: "bedroom-mood-board.png",
    type: "image",
    mimeType: "image/png",
    size: 3200000,
    width: 3000,
    height: 2000,
    url: "/media/bedroom-mood-board.png",
    folder: "inspiration",
    uploadedAt: "18 Feb 2026",
    usedIn: 0,
  },
  {
    id: "12",
    name: "spring-collection-teaser.mp4",
    type: "video",
    mimeType: "video/mp4",
    size: 22000000,
    url: "/media/spring-collection-teaser.mp4",
    folder: "videos",
    uploadedAt: "25 Feb 2026",
    usedIn: 0,
  },
];

const TYPE_CONFIG: Record<
  MediaType,
  { icon: React.ElementType; label: string; bg: string; color: string }
> = {
  image: { icon: Image, label: "Image", bg: "bg-[#C8924A]/15", color: "text-[#C8924A]" },
  video: { icon: Film, label: "Video", bg: "bg-purple-400/10", color: "text-purple-400" },
  document: { icon: FileText, label: "Document", bg: "bg-[#6B8A9A]/15", color: "text-[#6B8A9A]" },
};

const FOLDERS = ["All", "products", "blog", "brand", "videos", "documents", "inspiration"];

function formatBytes(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
}

function MediaThumbnail({
  item,
  selected,
  onToggle,
}: {
  item: MediaItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <button
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-[12px] border-2 text-left transition-all",
        selected ? "border-[#C8924A]" : "border-[#E8E6E1] hover:border-[#C8924A]/40",
      )}
    >
      {/* Thumbnail */}
      <div className={cn("flex aspect-square items-center justify-center bg-[#FCFBF9]", cfg.bg)}>
        {item.type === "image" ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F3F1EC] to-[#E8E6E1]">
            <Image size={28} className="text-[#8B8A86]" />
          </div>
        ) : (
          <Icon size={28} className={cfg.color} />
        )}
      </div>

      {/* Selection overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-white/70 transition-all",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
            selected ? "border-[#C8924A] bg-[#C8924A]" : "border-white/60",
          )}
        >
          {selected && <CheckSquare size={12} className="text-white" />}
        </div>
      </div>

      {/* Used-in badge */}
      {item.usedIn > 0 && (
        <div className="absolute right-1.5 top-1.5 rounded-full border border-[#E8E6E1] bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-[#6B6B68]">
          ×{item.usedIn}
        </div>
      )}
    </button>
  );
}

export function MediaWallTable() {
  const [search, setSearch] = useState("");
  const [typeFilter, setType] = useState<"All" | MediaType>("All");
  const [folderFilter, setFolder] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = MOCK_MEDIA.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q);
    return (
      matchSearch &&
      (typeFilter === "All" || m.type === typeFilter) &&
      (folderFilter === "All" || m.folder === folderFilter)
    );
  });

  const toggleSelect = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((s) => s !== id) : [...p, id]));

  const totalSize = MOCK_MEDIA.reduce((s, m) => s + m.size, 0);

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E6E1] bg-[#FCFBF9] px-5 py-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8A86]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="h-9 w-[180px] rounded-[9px] border border-[#D9D5CD] bg-white pl-8 pr-3 text-[12.5px] text-[#2B2A28] placeholder:text-[#8B8A86] focus:border-[#C8924A]/40 focus:outline-none"
          />
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1 rounded-[8px] border border-[#E8E6E1] bg-[#F5F3EF] p-0.5">
          {(["All", "image", "video", "document"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[11px] font-medium capitalize transition-all",
                typeFilter === t
                  ? "bg-[#C8924A] text-white"
                  : "text-[#6B6B68] hover:text-[#C8924A]",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Folder filter */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8A86]" />
          <select
            value={folderFilter}
            onChange={(e) => setFolder(e.target.value)}
            className="h-9 appearance-none rounded-[9px] border border-[#D9D5CD] bg-white pl-8 pr-7 text-[12.5px] text-[#2B2A28] focus:border-[#C8924A]/40 focus:outline-none"
          >
            {FOLDERS.map((f) => (
              <option key={f} value={f} className="capitalize">
                {f === "All" ? "All Folders" : f}
              </option>
            ))}
          </select>
          <ChevronDown
            size={11}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8A86]"
          />
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#C8924A]/10 px-3 py-1 text-[11px] text-[#C8924A]">
              {selected.length} selected
            </span>
            <button className="flex h-8 items-center gap-1.5 rounded-[8px] border border-[#D9D5CD] bg-white px-3 text-[12px] text-[#6B6B68] transition-all hover:border-red-400/30 hover:text-red-400">
              <Trash2 size={12} /> Delete
            </button>
            <button className="flex h-8 items-center gap-1.5 rounded-[8px] border border-[#D9D5CD] bg-white px-3 text-[12px] text-[#6B6B68] transition-all hover:border-[#C8924A]/30 hover:text-[#C8924A]">
              <Download size={12} /> Download
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11.5px] text-[#7A776F]">{formatBytes(totalSize)} used</span>
          {/* View toggle */}
          <div className="flex items-center rounded-[8px] border border-[#D9D5CD] bg-[#F5F3EF] p-0.5">
            {(
              [
                { mode: "grid", icon: Grid },
                { mode: "list", icon: List },
              ] as { mode: "grid" | "list"; icon: React.ElementType }[]
            ).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-[6px] transition-all",
                  viewMode === mode
                    ? "bg-[#C8924A] text-white"
                    : "text-[#6B6B68] hover:text-[#C8924A]",
                )}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
          <button className="flex h-9 items-center gap-2 rounded-[9px] bg-[#C8924A] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#B87E3E]">
            <Upload size={14} /> Upload
          </button>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((item) => (
            <div key={item.id}>
              <MediaThumbnail
                item={item}
                selected={selected.includes(item.id)}
                onToggle={() => toggleSelect(item.id)}
              />
              <div className="mt-1.5 px-0.5">
                <p className="truncate text-[10.5px] leading-tight text-[#2B2A28]">{item.name}</p>
                <p className="text-[10px] text-[#8A877F]">{formatBytes(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-[#2E231A]">
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={() =>
                      setSelected(
                        selected.length === filtered.length ? [] : filtered.map((m) => m.id),
                      )
                    }
                    className="h-4 w-4 rounded accent-[#C8924A]"
                  />
                </th>
                {["File", "Type", "Folder", "Size", "Dimensions", "Used In", "Uploaded", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7A776F]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE9]">
              {filtered.map((item) => {
                const cfg = TYPE_CONFIG[item.type];
                const Icon = cfg.icon;
                return (
                  <tr key={item.id} className="group transition-colors hover:bg-[#FCFBF9]">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="h-4 w-4 rounded accent-[#C8924A]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px]",
                            cfg.bg,
                          )}
                        >
                          <Icon size={14} className={cfg.color} />
                        </div>
                        <p className="max-w-[180px] truncate text-[12.5px] text-[#1A1A18]">
                          {item.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-medium capitalize",
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11.5px] capitalize text-[#6B6B68]">
                      {item.folder}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#6B6B68]">
                      {formatBytes(item.size)}
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-[#8A877F]">
                      {item.width ? `${item.width}×${item.height}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#6B6B68]">
                      {item.usedIn > 0 ? `${item.usedIn} pages` : "Unused"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[11px] text-[#8A877F]">
                      {item.uploadedAt}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-[#F5F3EF] hover:text-[#C8924A]">
                          <Copy size={12} />
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-[#F5F3EF] hover:text-[#C8924A]">
                          <Download size={12} />
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8B8A86] transition-all hover:bg-red-400/10 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[#E8E6E1] px-5 py-3">
        <span className="text-[12px] text-[#6B6B68]">{filtered.length} files</span>
        <span className="text-[12px] text-[#8A877F]">
          {MOCK_MEDIA.length} total · {formatBytes(totalSize)}
        </span>
      </div>
    </div>
  );
}
