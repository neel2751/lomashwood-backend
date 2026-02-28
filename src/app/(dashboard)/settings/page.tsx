"use client";

import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage general, security, integration, and audit log settings."
      />
    </div>
  );
}