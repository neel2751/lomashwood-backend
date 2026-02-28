"use client";

import { ReviewTable } from "@/components/customers/ReviewTable";
import { PageHeader } from "@/components/layout/PageHeader";

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