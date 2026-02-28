"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeoForm } from "@/components/content/SeoForm";

export default function SeoDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit SEO"
        description="Update SEO metadata for this page."
        backHref="/content/seo"
      />
      <SeoForm id={id} />
    </div>
  );
}