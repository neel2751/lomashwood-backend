"use client";

import { RoleTable } from "@/components/auth/RoleTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles"
        description="Manage roles and their associated permissions."
        backHref="/auth"
        actionLabel="New Role"
        actionHref="/auth/roles/new"
      />
      <RoleTable />
    </div>
  );
}