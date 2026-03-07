"use client";



import { SeoForm } from "@/components/content/SeoForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SeoDetailPage() {
  

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit SEO"
        description="Update SEO metadata for this page."
        backHref="/content/seo"
      />
      <SeoForm />
    </div>
  );
}
export const dynamic = 'force-dynamic'
