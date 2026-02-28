"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupportTicketDetail } from "@/components/customers/SupportTicketDetail";

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support Ticket"
        description="View and respond to this support ticket."
        backHref="/customers/support"
      />
      <SupportTicketDetail id={id} />
    </div>
  );
}