"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SecuritySettingsForm } from "@/components/settings/SecuritySettingsForm";

export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Security Settings"
        description="Manage password policies, two-factor authentication, and access controls."
        backHref="/settings"
      />
      <SecuritySettingsForm />
    </div>
  );
}