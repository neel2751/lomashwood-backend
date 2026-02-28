"use client";

import { UserForm } from "@/components/auth/UserForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New User"
        description="Create a new admin or staff user account."
        backHref="/auth/users"
      />
      <UserForm />
    </div>
  );
}