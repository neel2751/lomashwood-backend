"use client";

import { LandingPageEditor } from "@/components/content/LandingPageEditor";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewLandingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Landing Page"
        description="Create a new campaign or promotional landing page."
        backHref="/content/landing-pages"
      />
      <LandingPageEditor />
    </div>
  );
}