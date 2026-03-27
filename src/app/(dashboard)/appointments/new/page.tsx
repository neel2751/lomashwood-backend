"use client";

import { useRouter } from "next/navigation";

import { AppointmentEditorForm } from "@/components/appointments/AppointmentEditorForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { useToast } from "@/hooks/use-toast";

import type { CreateAppointmentPayload } from "@/types/appointment.types";

export default function NewAppointmentPage() {
  const router = useRouter();
  const toast = useToast();
  const createAppointment = useCreateAppointment();

  async function handleCreate(payload: CreateAppointmentPayload) {
    try {
      await createAppointment.mutateAsync(payload);
      toast.success("Appointment created");
      router.push("/appointments");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create appointment";
      toast.error("Failed to create appointment", message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Appointment"
        description="Book a new appointment using live consultant availability."
        backHref="/appointments"
        backLabel="Appointments"
      />

      <AppointmentEditorForm
        submitLabel="Create Appointment"
        onSubmit={handleCreate}
        isSubmitting={createAppointment.isPending}
      />
    </div>
  );
}
