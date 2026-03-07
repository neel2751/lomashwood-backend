"use client";

import Link from "next/link";

import { RoleTable } from "@/components/auth/RoleTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Roles"
          description="Manage roles and their associated permissions."
          backHref="/auth"
        />
        <Link href="/auth/roles/new" className="btn-primary">
          New Role
        </Link>
      </div>
      <RoleTable />
    </div>
  );
}
export const dynamic = 'force-dynamic'
