"use client";

import { ShowroomForm } from "@/components/appointments/ShowroomForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useShowroom } from "@/hooks/useShowrooms";

export default function EditShowroomPage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = useShowroom(params.id);

  const showroom = (data ?? null) as any;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Showroom"
        description="Update showroom address, displays, opening hours, and team."
        backHref="/appointments/showrooms"
      />

      {isLoading && <div className="rounded-lg border border-[#E8E6E1] bg-white p-6 text-sm text-[#6B6B68]">Loading showroom...</div>}
      {isError && <div className="rounded-lg border border-[#E8E6E1] bg-white p-6 text-sm text-red-600">Failed to load showroom.</div>}
      {!isLoading && !isError && showroom && <ShowroomForm showroomId={params.id} initialData={showroom} />}
    </div>
  );
}

export const dynamic = "force-dynamic";
