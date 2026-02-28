"use client";

import { SessionTable } from "@/components/auth/SessionTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SessionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sessions"
        description="Monitor and manage all active user sessions."
        backHref="/auth"
      />
      <SessionTable />
    </div>
  );
}