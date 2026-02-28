"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerDetail } from "@/components/customers/CustomerDetail";
import { CustomerTimeline } from "@/components/customers/CustomerTimeline";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customer Detail"
        description="View and manage customer information."
        backHref="/customers"
      />
      <CustomerDetail id={id} />
      <CustomerTimeline id={id} />
    </div>
  );
}