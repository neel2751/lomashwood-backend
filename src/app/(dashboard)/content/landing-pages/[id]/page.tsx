"use client";



import { LandingPageEditor } from "@/components/content/LandingPageEditor";
import { PageHeader } from "@/components/layout/PageHeader";

export default function LandingPageDetailPage() {
  

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Landing Page"
        description="Update this campaign or promotional landing page."
        backHref="/content/landing-pages"
      />
      <LandingPageEditor />
    </div>
  );
}
export const dynamic = 'force-dynamic'
