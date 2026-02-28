"use client";

import { SeoForm } from "@/components/content/SeoForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SeoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SEO"
        description="Manage SEO metadata across all pages."
        backHref="/content"
      />
      <SeoForm />
    </div>
  );
}