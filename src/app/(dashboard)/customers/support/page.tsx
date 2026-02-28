"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SupportTicketTable } from "@/components/customers/SupportTicketTable";

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