"use client";

import Link from "next/link";

import { BrochureTable } from "@/components/content/BrochureTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BrochuresPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Brochures"
          description="Manage brochure files, metadata, and publication status."
          backHref="/content"
        />
        <div className="flex items-center gap-2">
          <Link href="/content/brochures/requests" className="btn-primary">
            View Requests
          </Link>
          <Link href="/content/brochures/new" className="btn-primary">
            New Brochure
          </Link>
        </div>
      </div>

      <BrochureTable />
    </div>
  );
}

export const dynamic = "force-dynamic";
