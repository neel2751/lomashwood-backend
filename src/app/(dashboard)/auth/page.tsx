"use client";

import { PageHeader } from "@/components/layout/PageHeader";

export default function AuthPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auth Management"
        description="Manage users, roles, permissions, and active sessions."
      />
    </div>
  );
}