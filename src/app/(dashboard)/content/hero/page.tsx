"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { HeroSlidesTable } from "@/components/content/HeroSlidesTable";
import { HeroSlideEditor } from "@/components/content/HeroSlideEditor";
import type { HeroSlide } from "@/hooks/useHeroSlides";

export default function HeroSectionPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  const handleNew = () => {
    setEditingSlide(null);
    setEditorOpen(true);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setEditorOpen(true);
  };

  const handleClose = () => {
    setEditorOpen(false);
    setEditingSlide(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hero Section"
        description="Manage hero slides for your homepage. Drag to reorder slides."
        backHref="/content"
      />

      <HeroSlidesTable onEdit={handleEdit} onNew={handleNew} />

      {editorOpen && <HeroSlideEditor slide={editingSlide} onClose={handleClose} />}
    </div>
  );
}

export const dynamic = "force-dynamic";
