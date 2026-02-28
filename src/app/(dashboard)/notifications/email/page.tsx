"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmailLogTable } from "@/components/notifications/EmailLogTable";

export default function EmailNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email Notifications"
        description="View all sent and scheduled email notifications."
        backHref="/notifications"
      />
      <EmailLogTable />
    </div>
  );
}