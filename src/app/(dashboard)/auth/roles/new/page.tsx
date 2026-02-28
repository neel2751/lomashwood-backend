"use client";

import { PermissionsMatrix } from "@/components/auth/PermissionsMatrix";
import { RoleForm } from "@/components/auth/RoleForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewRolePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Role"
        description="Create a new role and assign permissions."
        backHref="/auth/roles"
      />
      <RoleForm />
      <PermissionsMatrix />
    </div>
  );
}