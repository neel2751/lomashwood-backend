"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ReviewTable } from "@/components/customers/ReviewTable";

export default function ReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customer Reviews"
        description="Moderate and manage all customer reviews."
        backHref="/customers"
      />
      <ReviewTable />
    </div>
  );
}