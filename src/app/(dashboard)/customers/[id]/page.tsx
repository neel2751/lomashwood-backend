"use client";

import { useParams } from "next/navigation";

import { CustomerDetail } from "@/components/customers/CustomerDetail";
import { CustomerTimeline } from "@/components/customers/CustomerTimeline";
import { PageHeader } from "@/components/layout/PageHeader";

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