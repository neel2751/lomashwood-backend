"use client";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";

import { ConsultantForm } from "@/components/appointments/ConsultantForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConsultant, useUpdateConsultant } from "@/hooks/useConsultants";
import { useToast } from "@/hooks/use-toast";

export default function EditConsultantPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();

  const { data, isLoading, isError } = useConsultant(params.id);
  const updateConsultant = useUpdateConsultant();

  const consultant = data as any;

  const handleSave = (payload: any) => {
    const safeStatus = payload.status === "active" ? "active" : "inactive";

    updateConsultant.mutate(
      {
        id: params.id,
        payload: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          status: safeStatus,
          speciality: payload.specs ?? [],
          notes: payload.bio,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Consultant updated", "Changes were saved successfully.");
          router.push(`/appointments/consultants/${params.id}`);
        },
        onError: (error: any) => {
          toast.error("Failed to update consultant", error?.message || "Please try again.");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Consultant"
        description="Update this consultant profile and settings."
        backHref={`/appointments/consultants/${params.id}`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading consultant…</span>
        </div>
      ) : isError || !consultant ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load consultant for editing.
        </div>
      ) : (
        <ConsultantForm
          isEdit
          initialData={{
            name: consultant.name,
            email: consultant.email,
            phone: consultant.phone ?? "",
            bio: consultant.notes ?? "",
            specialisation: consultant.speciality ?? ["Kitchen"],
            types: ["showroom", "online"],
            status: consultant.status === "active" ? "active" : "inactive",
            maxPerDay: 6,
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
