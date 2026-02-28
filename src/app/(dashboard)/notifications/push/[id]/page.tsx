"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationDetail } from "@/components/notifications/NotificationDetail";

export default function PushNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Push Notification Detail"
        description="View the details of this push notification."
        backHref="/notifications/push"
      />
      <NotificationDetail id={id} channel="push" />
    </div>
  );
}