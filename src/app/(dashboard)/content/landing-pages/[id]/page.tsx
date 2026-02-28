"use client";

import { useParams } from "next/navigation";

import { LandingPageEditor } from "@/components/content/LandingPageEditor";
import { PageHeader } from "@/components/layout/PageHeader";

export default function LandingPageDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Landing Page"
        description="Update this campaign or promotional landing page."
        backHref="/content/landing-pages"
      />
      <LandingPageEditor id={id} />
    </div>
  );
}