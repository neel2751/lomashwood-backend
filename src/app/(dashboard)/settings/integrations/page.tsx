"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { IntegrationCard } from "@/components/settings/IntegrationCard";

export default function IntegrationsSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Integrations"
        description="Manage third-party integrations such as Google Tag Manager, Search Console, and more."
        backHref="/settings"
      />
      <IntegrationCard />
    </div>
  );
}