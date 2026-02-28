"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LandingPageTable } from "@/components/content/LandingPageTable";

export default function LandingPagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Landing Pages"
        description="Manage all campaign and promotional landing pages."
        backHref="/content"
        actionLabel="New Landing Page"
        actionHref="/content/landing-pages/new"
      />
      <LandingPageTable />
    </div>
  );
}