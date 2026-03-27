"use client";

import { useMemo } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppointmentEditorForm } from "@/components/appointments/AppointmentEditorForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { useToast } from "@/hooks/use-toast";

import type { Appointment, CreateAppointmentPayload } from "@/types/appointment.types";

type PageProps = {
  params: { id: string };
};

export default function EditAppointmentPage({ params }: PageProps) {
  const router = useRouter();
  const toast = useToast();
  const appointmentQuery = useAppointment(params.id);
  const updateAppointment = useUpdateAppointment();

  const appointment = appointmentQuery.data as Appointment | undefined;

  const initialData = useMemo(() => {
    if (!appointment) return undefined;

    return {
      type: appointment.type,
      forKitchen: appointment.forKitchen,
      forBedroom: appointment.forBedroom,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone,
      postcode: appointment.postcode,
      address: appointment.address,
      slot: appointment.slot,
      consultantId: appointment.consultantId,
      showroomId: appointment.showroomId,
      notes: appointment.notes,
    } satisfies Partial<CreateAppointmentPayload>;
  }, [appointment]);

  async function handleUpdate(payload: CreateAppointmentPayload) {
    if (!appointment) return;

    const nextPayload: Partial<CreateAppointmentPayload> = { ...payload };
    if (
      nextPayload.slot &&
      new Date(nextPayload.slot).getTime() === new Date(appointment.slot).getTime()
    ) {
      nextPayload.slot = undefined;
    }

    try {
      await updateAppointment.mutateAsync({ id: appointment.id, payload: nextPayload });
      toast.success("Appointment updated");
      router.push(`/appointments/${appointment.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update appointment";
      toast.error("Failed to update appointment", message);
    }
  }

  if (appointmentQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading appointment...</p>;
  }

  if (appointmentQuery.isError || !appointment || !initialData) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Unable to load appointment.</p>
        <Link href="/appointments" className="text-sm font-medium text-[#1A1A18] underline">
          Back to appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Appointment"
        description="Update customer details, consultant, showroom, and slot."
        backHref={`/appointments/${appointment.id}`}
        backLabel="Appointment details"
      />

      <AppointmentEditorForm
        initialData={initialData}
        submitLabel="Update Appointment"
        onSubmit={handleUpdate}
        isSubmitting={updateAppointment.isPending}
      />
    </div>
  );
}
