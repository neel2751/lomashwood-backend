"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoyaltyAdjustForm } from "@/components/customers/LoyaltyAdjustForm";

export default function LoyaltyDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Loyalty Detail"
        description="View and adjust loyalty points for this customer."
        backHref="/customers/loyalty"
      />
      <LoyaltyAdjustForm id={id} />
    </div>
  );
}