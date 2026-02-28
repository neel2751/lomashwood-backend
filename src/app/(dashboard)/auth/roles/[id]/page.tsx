"use client";

import { useParams } from "next/navigation";

import { PermissionsMatrix } from "@/components/auth/PermissionsMatrix";
import { RoleForm } from "@/components/auth/RoleForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Role"
        description="Update this role and its permissions."
        backHref="/auth/roles"
      />
      <RoleForm id={id} />
      <PermissionsMatrix roleId={id} />
    </div>
  );
}