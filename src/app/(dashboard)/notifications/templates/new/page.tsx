"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { TemplateEditor } from "@/components/notifications/TemplateEditor";

export default function NewNotificationTemplatePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Notification Template"
        description="Create a new reusable notification template."
        backHref="/notifications/templates"
      />
      <TemplateEditor />
    </div>
  );
}