"use client";



import Link from "next/link";
import { UserTable } from "@/components/auth/UserTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Users"
          description="Manage all admin and staff user accounts."
          backHref="/auth"
        />
        <Link href="/auth/users/new" className="btn-primary">
          New User
        </Link>
      </div>
      <UserTable />
    </div>
  );
}