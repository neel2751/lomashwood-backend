"use client";

import { SupportTicketDetail } from "@/components/customers/SupportTicketDetail";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SupportTicketDetailPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support Ticket"
        description="View and respond to this support ticket."
        backHref="/customers/support"
      />
      <SupportTicketDetail />
    </div>
  );
}