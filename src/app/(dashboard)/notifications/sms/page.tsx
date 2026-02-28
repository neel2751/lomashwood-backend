"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SmsLogTable } from "@/components/notifications/SmsLogTable";

export default function SmsNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SMS Notifications"
        description="View all sent and scheduled SMS notifications."
        backHref="/notifications"
      />
      <SmsLogTable />
    </div>
  );
}