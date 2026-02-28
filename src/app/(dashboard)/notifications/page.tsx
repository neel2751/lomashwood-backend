"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationLogTable } from "@/components/notifications/NotificationLogTable";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Overview of all email, SMS, and push notification activity."
      />
      <NotificationLogTable />
    </div>
  );
}