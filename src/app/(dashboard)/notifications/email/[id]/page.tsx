"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationDetail } from "@/components/notifications/NotificationDetail";

export default function EmailNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email Notification Detail"
        description="View the details of this email notification."
        backHref="/notifications/email"
      />
      <NotificationDetail id={id} channel="email" />
    </div>
  );
}