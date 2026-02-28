"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { PushLogTable } from "@/components/notifications/PushLogTable";

export default function PushNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Push Notifications"
        description="View all sent and scheduled push notifications."
        backHref="/notifications"
      />
      <PushLogTable />
    </div>
  );
}