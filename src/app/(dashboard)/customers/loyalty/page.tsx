"use client";

import { LoyaltyTable } from "@/components/customers/LoyaltyTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function LoyaltyPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Loyalty Programme"
        description="Manage customer loyalty points and rewards."
        backHref="/customers"
      />
      <LoyaltyTable />
    </div>
  );
}