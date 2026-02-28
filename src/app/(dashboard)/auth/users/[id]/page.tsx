"use client";

import { useParams } from "next/navigation";

import { UserDetail } from "@/components/auth/UserDetail";
import { PageHeader } from "@/components/layout/PageHeader";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Detail"
        description="View and edit this user account."
        backHref="/auth/users"
      />
      <UserDetail id={id} />
    </div>
  );
}