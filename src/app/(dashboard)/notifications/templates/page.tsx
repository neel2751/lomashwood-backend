"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { TemplateTable } from "@/components/notifications/TemplateTable";

export default function NotificationTemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notification Templates"
        description="Manage reusable templates for email, SMS, and push notifications."
        backHref="/notifications"
        actionLabel="New Template"
        actionHref="/notifications/templates/new"
      />
      <TemplateTable />
    </div>
  );
}