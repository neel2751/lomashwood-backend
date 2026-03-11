"use client";

import { useParams, useRouter } from "next/navigation";

import { ShowroomForm } from "@/components/showrooms/ShowroomForm";
import { useShowroom, useUpdateShowroom } from "@/hooks";
import type { CreateShowroomPayload, Showroom } from "@/types/showroom.types";

export default function EditShowroomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading, isError } = useShowroom(id);
  const updateShowroom = useUpdateShowroom();

  const showroom = data as Showroom | undefined;

  const handleSubmit = async (payload: CreateShowroomPayload) => {
    await updateShowroom.mutateAsync({ id, payload });
    router.push(`/showrooms/${id}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-8">
        <p className="text-center text-[#5A4232]">Loading showroom...</p>
      </div>
    );
  }

  if (isError || !showroom) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-8">
        <p className="text-center text-red-400">Failed to load showroom.</p>
      </div>
    );
  }

  return (
    <ShowroomForm
      mode="edit"
      initialData={showroom}
      isSubmitting={updateShowroom.isPending}
      onSubmit={handleSubmit}
    />
  );
}
