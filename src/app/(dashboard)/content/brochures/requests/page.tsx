"use client";

import Link from "next/link";

import { BrochureRequestTable } from "@/components/content/BrochureRequestTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BrochureRequestsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Brochure Requests"
          description="View and filter all brochure form submissions."
          backHref="/content/brochures"
          backLabel="Brochures"
        />
        <Link href="/content/brochures" className="btn-primary">
          Back to Brochures
        </Link>
      </div>

      <BrochureRequestTable />
    </div>
  );
}

export const dynamic = "force-dynamic";
