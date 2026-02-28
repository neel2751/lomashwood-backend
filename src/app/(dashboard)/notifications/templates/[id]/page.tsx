"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TemplateEditor } from "@/components/notifications/TemplateEditor";

export default function NotificationTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Notification Template"
        description="Update this notification template."
        backHref="/notifications/templates"
      />
      <TemplateEditor id={id} />
    </div>
  );
}