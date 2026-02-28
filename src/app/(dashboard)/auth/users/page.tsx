"use client";

import { UserTable } from "@/components/auth/UserTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage all admin and staff user accounts."
        backHref="/auth"
        actionLabel="New User"
        actionHref="/auth/users/new"
      />
      <UserTable />
    </div>
  );
}