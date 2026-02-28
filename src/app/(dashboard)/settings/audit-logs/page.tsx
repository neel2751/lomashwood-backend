"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { AuditLogTable } from "@/components/settings/AuditLogTable";

export default function AuditLogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Logs"
        description="Review a complete log of all admin actions and system events."
        backHref="/settings"
      />
      <AuditLogTable />
    </div>
  );
}