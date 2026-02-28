"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationDetail } from "@/components/notifications/NotificationDetail";

export default function SmsNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SMS Notification Detail"
        description="View the details of this SMS notification."
        backHref="/notifications/sms"
      />
      <NotificationDetail id={id} channel="sms" />
    </div>
  );
}