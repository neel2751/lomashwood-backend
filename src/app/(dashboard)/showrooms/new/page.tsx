"use client";

import { useRouter } from "next/navigation";

import { useCreateShowroom } from "@/hooks";
import { ShowroomForm } from "@/components/showrooms/ShowroomForm";
import type { CreateShowroomPayload } from "@/types/showroom.types";

export default function CreateShowroomPage() {
  const router = useRouter();
  const createShowroom = useCreateShowroom();

  const handleSubmit = async (payload: CreateShowroomPayload) => {
    await createShowroom.mutateAsync(payload);
    router.push("/showrooms");
  };

  return (
    <ShowroomForm
      mode="create"
      isSubmitting={createShowroom.isPending}
      onSubmit={handleSubmit}
    />
  );
}