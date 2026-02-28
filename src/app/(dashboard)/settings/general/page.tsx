"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";

export default function GeneralSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="General Settings"
        description="Configure site name, contact details, and global preferences."
        backHref="/settings"
      />
      <GeneralSettingsForm />
    </div>
  );
}