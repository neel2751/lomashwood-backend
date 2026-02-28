"use client";

import { PageHeader } from "@/components/layout/PageHeader";

export default function ContentPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Content"
        description="Manage blogs, media wall, CMS pages, SEO, and landing pages."
      />
    </div>
  );
}