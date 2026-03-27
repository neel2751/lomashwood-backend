"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { useToast } from "@/hooks/use-toast";

type PageProps = {
  params: { id: string };
};

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

type AppointmentRecord = {
  id: string;
  type: "home" | "online" | "showroom";
  forKitchen: boolean;
  forBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  slot: string;
  status: AppointmentStatus;
  consultantName?: string;
  showroomName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

function formatInterest(item: AppointmentRecord) {
  if (item.forKitchen && item.forBedroom) return "Kitchen + Bedroom";
  if (item.forKitchen) return "Kitchen";
  if (item.forBedroom) return "Bedroom";
  return "General";
}

export default function AppointmentDetailPage({ params }: PageProps) {
  const toast = useToast();
  const appointmentQuery = useAppointment(params.id);
  const updateAppointment = useUpdateAppointment();
  const appointment = appointmentQuery.data as AppointmentRecord | undefined;

  const [status, setStatus] = useState<AppointmentStatus>("pending");

  useEffect(() => {
    if (!appointment) return;
    setStatus(appointment.status);
  }, [appointment]);

  const slotDate = useMemo(() => (appointment ? new Date(appointment.slot) : null), [appointment]);

  async function handleSaveStatus() {
    if (!appointment) return;

    try {
      await updateAppointment.mutateAsync({ id: appointment.id, payload: { status } });
      toast.success("Appointment status updated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update appointment status";
      toast.error("Failed to update status", message);
    }
  }

  async function handleCancel() {
    if (!appointment) return;

    try {
      await updateAppointment.mutateAsync({ id: appointment.id, payload: { status: "cancelled" } });
      setStatus("cancelled");
      toast.success("Appointment cancelled");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel appointment";
      toast.error("Failed to cancel appointment", message);
    }
  }

  if (appointmentQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading appointment...</p>;
  }

  if (appointmentQuery.isError || !appointment) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Unable to load appointment details.</p>
        <Link href="/appointments" className="text-sm font-medium text-[#1A1A18] underline">
          Back to appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/appointments" className="text-sm text-neutral-600 underline">
            Back to appointments
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-[#1A1A18]">{appointment.customerName}</h1>
          <p className="text-sm text-neutral-600">
            Booked on {new Date(appointment.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCancel()}
          className="h-9 rounded-md border border-red-300 px-3 text-sm font-medium text-red-700"
          disabled={updateAppointment.isPending || appointment.status === "cancelled"}
        >
          Cancel Appointment
        </button>
      </div>

      <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Type</p>
          <p className="text-sm font-medium capitalize text-[#1A1A18]">{appointment.type}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Interest</p>
          <p className="text-sm font-medium text-[#1A1A18]">{formatInterest(appointment)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Date</p>
          <p className="text-sm font-medium text-[#1A1A18]">{slotDate?.toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Time</p>
          <p className="text-sm font-medium text-[#1A1A18]">
            {slotDate?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Consultant</p>
          <p className="text-sm font-medium text-[#1A1A18]">
            {appointment.consultantName || "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Showroom</p>
          <p className="text-sm font-medium text-[#1A1A18]">
            {appointment.showroomName || "Not set"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#1A1A18]">Status</h2>
          <select
            className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No show</option>
          </select>
          <button
            type="button"
            onClick={() => void handleSaveStatus()}
            className="h-9 rounded-md bg-[#1A1A18] px-3 text-sm font-medium text-white"
            disabled={updateAppointment.isPending}
          >
            Save Status
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#1A1A18]">Reschedule</h2>
          <p className="text-sm text-neutral-600">
            Use the edit screen to select only currently available slots.
          </p>
          <Link
            href={`/appointments/${appointment.id}/edit`}
            className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-medium text-[#1A1A18] hover:bg-neutral-50"
          >
            Edit Appointment
          </Link>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Customer</p>
          <p className="text-sm text-[#1A1A18]">{appointment.customerName}</p>
          <p className="text-sm text-neutral-700">{appointment.customerEmail}</p>
          <p className="text-sm text-neutral-700">{appointment.customerPhone}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Address</p>
          <p className="text-sm text-[#1A1A18]">{appointment.address}</p>
          <p className="text-sm text-neutral-700">{appointment.postcode}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Notes</p>
          <p className="text-sm text-[#1A1A18]">{appointment.notes || "No notes"}</p>
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
