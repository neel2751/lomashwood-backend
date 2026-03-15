"use client";

import Link from "next/link";

import { LandingPageTable } from "@/components/content/LandingPageTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function LandingPagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Landing Pages"
          description="Manage all campaign and promotional landing pages."
          backHref="/content"
        />
        <Link href="/content/landing-pages/new" className="btn-primary">
          New Landing Page
        </Link>
      </div>
      <LandingPageTable />
    </div>
  );
}
export const dynamic = "force-dynamic";
