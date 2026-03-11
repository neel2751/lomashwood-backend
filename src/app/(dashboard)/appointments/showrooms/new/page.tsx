"use client";

import { ShowroomForm } from "@/components/appointments/ShowroomForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewShowroomPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add New Showroom"
        description="Create a showroom location with full display and team details."
        backHref="/appointments/showrooms"
      />
      <ShowroomForm />
    </div>
  );
}

export const dynamic = "force-dynamic";
