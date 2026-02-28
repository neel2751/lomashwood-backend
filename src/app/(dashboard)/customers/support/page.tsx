"use client";

import { SupportTicketTable } from "@/components/customers/SupportTicketTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support Tickets"
        description="View and manage all customer support tickets."
        backHref="/customers"
      />
      <SupportTicketTable />
    </div>
  );
}