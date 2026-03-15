"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Film,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useHeroSlides,
  useDeleteHeroSlide,
  useUpdateHeroSlide,
  useReorderHeroSlides,
  type HeroSlide,
} from "@/hooks/useHeroSlides";

interface HeroSlidesTableProps {
  onEdit: (slide: HeroSlide) => void;
  onNew: () => void;
}

export function HeroSlidesTable({ onEdit, onNew }: HeroSlidesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useHeroSlides();
  const deleteSlide = useDeleteHeroSlide();
  const updateSlide = useUpdateHeroSlide();
  const reorderSlides = useReorderHeroSlides();

  const slides = data?.data ?? [];

  const filtered = slides.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.title.toLowerCase().includes(q) ||
      (s.subtitle?.toLowerCase().includes(q) ?? false) ||
      (s.description?.toLowerCase().includes(q) ?? false);
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.isActive) ||
      (statusFilter === "inactive" && !s.isActive);
    return matchSearch && matchStatus;
  });

  const handleToggleActive = (slide: HeroSlide) => {
    updateSlide.mutate({ id: slide.id, payload: { isActive: !slide.isActive } });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this slide?")) {
      deleteSlide.mutate(id);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = slides.map((s) => s.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedId);

    reorderSlides.mutate(currentOrder);
    setDraggedId(null);
  };

  const activeCount = slides.filter((s) => s.isActive).length;
  const inactiveCount = slides.filter((s) => !s.isActive).length;

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611] p-8">
        <p className="text-center text-[#5A4232]">Loading hero slides...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611] p-8">
        <p className="text-center text-red-400">Failed to load hero slides.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#2E231A] bg-[#1C1611]">
      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-[#2E231A] border-b border-[#2E231A] bg-[#1A100C]">
        {[
          { label: "Total Slides", value: slides.length.toString(), icon: ImageIcon },
          { label: "Active", value: activeCount.toString(), icon: Eye },
          { label: "Inactive", value: inactiveCount.toString(), icon: EyeOff },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-3">
            <Icon size={14} className="text-[#C8924A]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3D2E1E]">
                {label}
              </p>
              <p className="text-[15px] font-bold text-[#E8D5B7]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#2E231A] px-5 py-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search slides…"
            className="h-9 w-[210px] rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] pl-8 pr-3 text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:border-[#C8924A]/40 focus:outline-none"
          />
        </div>

        <div className="flex gap-1 rounded-[8px] bg-[#2E231A] p-0.5">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[11px] font-medium capitalize transition-all",
                statusFilter === s
                  ? "bg-[#C8924A] text-white"
                  : "text-[#5A4232] hover:text-[#C8924A]",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={onNew}
          className="ml-auto flex h-9 items-center gap-2 rounded-[9px] bg-[#C8924A] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#B87E3E]"
        >
          <Plus size={14} /> New Slide
        </button>
      </div>

      {/* Slides list */}
      <div className="divide-y divide-[#2E231A]">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-[#5A4232]">No slides found</p>
          </div>
        ) : (
          filtered.map((slide) => (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, slide.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, slide.id)}
              className={cn(
                "group flex cursor-move items-center gap-4 px-5 py-4 transition-colors hover:bg-[#221A12]",
                draggedId === slide.id && "opacity-50",
              )}
            >
              {/* Drag handle */}
              <div className="text-[#3D2E1E] transition-colors group-hover:text-[#5A4232]">
                <GripVertical size={16} />
              </div>

              {/* Thumbnail */}
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-[8px] border border-[#3D2E1E] bg-[#2E231A]">
                {slide.type === "image" ? (
                  <Image src={slide.src} alt={slide.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film size={20} className="text-purple-400" />
                  </div>
                )}
                <div className="absolute left-1 top-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                      slide.type === "image"
                        ? "bg-[#C8924A]/20 text-[#C8924A]"
                        : "bg-purple-400/20 text-purple-400",
                    )}
                  >
                    {slide.type === "image" ? <ImageIcon size={8} /> : <Film size={8} />}
                    {slide.type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-[13px] font-semibold text-[#C8B99A]">
                    {slide.title}
                  </h4>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      slide.isActive
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-[#3D2E1E] text-[#5A4232]",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        slide.isActive ? "bg-emerald-400" : "bg-[#5A4232]",
                      )}
                    />
                    {slide.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {slide.subtitle && (
                  <p className="mt-0.5 truncate text-[11px] text-[#5A4232]">{slide.subtitle}</p>
                )}
                <div className="mt-1 flex items-center gap-3">
                  {slide.ctaText && (
                    <span className="text-[10px] text-[#7A6045]">CTA: {slide.ctaText}</span>
                  )}
                  {slide.secondaryCtaText && (
                    <span className="text-[10px] text-[#7A6045]">
                      Secondary: {slide.secondaryCtaText}
                    </span>
                  )}
                </div>
              </div>

              {/* Order badge */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3D2E1E] bg-[#2E231A]">
                <span className="text-[11px] font-bold text-[#5A4232]">{slide.order + 1}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleToggleActive(slide)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-[6px] transition-all",
                    slide.isActive
                      ? "text-emerald-400 hover:bg-emerald-400/10"
                      : "text-[#5A4232] hover:bg-[#2E231A] hover:text-emerald-400",
                  )}
                  title={slide.isActive ? "Deactivate" : "Activate"}
                >
                  {slide.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={() => onEdit(slide)}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#5A4232] transition-all hover:bg-[#2E231A] hover:text-[#C8924A]"
                >
                  <Pencil size={13} />
                </button>
                <a
                  href={slide.src}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#5A4232] transition-all hover:bg-[#2E231A] hover:text-[#C8924A]"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#5A4232] transition-all hover:bg-red-400/10 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#2E231A] px-5 py-3">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} slides</span>
        <span className="text-[12px] text-[#3D2E1E]">Drag to reorder · {activeCount} active</span>
      </div>
    </div>
  );
}
