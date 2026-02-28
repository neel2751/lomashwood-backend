"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LandingPageEditor } from "@/components/content/LandingPageEditor";

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