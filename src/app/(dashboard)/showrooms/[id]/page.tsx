"use client";

import { useParams } from "next/navigation";
import { useShowroom } from "@/hooks";
import { ShowroomDetails } from "@/components/showrooms/ShowroomDetails";
import type { Showroom } from "@/types/showroom.types";

export default function DetailShowroomPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const { data, isLoading, isError } = useShowroom(id);
  const showroom = data as Showroom | undefined;

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

  return <ShowroomDetails showroom={showroom} />;
}
