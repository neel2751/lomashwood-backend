"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { fetchWithAuth } from "@/lib/fetch-client";
import { useReminder, useUpdateReminder } from "@/hooks/useReminders";
import { useToast } from "@/hooks/use-toast";

type Props = { params: { id: string } };

type ReminderRecord = {
  id: string;
  appointmentId: string;
  type: "email" | "sms";
  status: "pending" | "sent" | "failed";
  scheduledAt: string;
  sentAt?: string | null;
  appointment?: {
    id: string;
    customerName?: string;
    customerEmail?: string;
    type?: "home" | "online" | "showroom";
    slot?: string;
  };
};

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export default function ReminderDetailPage({ params }: Props) {
  const toast = useToast();
  const reminderQuery = useReminder(params.id);
  const updateReminder = useUpdateReminder();

  const reminder = reminderQuery.data as ReminderRecord | undefined;

  const [type, setType] = useState<"email" | "sms">("email");
  const [status, setStatus] = useState<"pending" | "sent" | "failed">("pending");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (!reminder) return;
    setType(reminder.type);
    setStatus(reminder.status);
    setScheduledAt(toDatetimeLocalValue(reminder.scheduledAt));
  }, [reminder]);

  async function handleSave() {
    if (!reminder || !scheduledAt) return;

    try {
      await updateReminder.mutateAsync({
        id: reminder.id,
        payload: {
          type,
          status,
          scheduledAt: new Date(scheduledAt).toISOString(),
        },
      });
      toast.success("Reminder updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update reminder";
      toast.error("Failed to update reminder", message);
    }
  }

  async function handleSendNow() {
    if (!reminder) return;

    try {
      await fetchWithAuth(`/api/reminders/${reminder.id}/send`, {
        method: "POST",
      });
      toast.success("Reminder send triggered");
      await reminderQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reminder";
      toast.error("Failed to send reminder", message);
    }
  }

  if (reminderQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading reminder...</p>;
  }

  if (reminderQuery.isError || !reminder) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Unable to load reminder.</p>
        <Link
          href="/appointments/reminders"
          className="text-sm font-medium text-[#1A1A18] underline"
        >
          Back to reminders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={`Reminder ${reminder.id.slice(-6)}`}
          description="Manage delivery channel, status, and schedule."
          backHref="/appointments/reminders"
          backLabel="Reminders"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSendNow()}
            className="inline-flex h-9 items-center rounded-md border border-[#E8E6E1] bg-white px-3 text-sm font-medium text-[#1A1A18]"
          >
            Send now
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={updateReminder.isPending}
            className="inline-flex h-9 items-center rounded-md bg-[#1A1A18] px-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {updateReminder.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Customer</p>
          <p className="text-sm font-medium text-[#1A1A18]">
            {reminder.appointment?.customerName ?? "Unknown customer"}
          </p>
          <p className="text-sm text-neutral-700">{reminder.appointment?.customerEmail ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Appointment</p>
          <p className="text-sm font-medium capitalize text-[#1A1A18]">
            {reminder.appointment?.type ?? "-"}
          </p>
          <p className="text-sm text-neutral-700">
            {reminder.appointment?.slot
              ? new Date(reminder.appointment.slot).toLocaleString("en-GB")
              : "-"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-[#1A1A18]">
          Channel
          <select
            value={type}
            onChange={(event) => setType(event.target.value as "email" | "sms")}
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-[#1A1A18]">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "pending" | "sent" | "failed")}
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-[#1A1A18]">
          Scheduled At
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm"
          />
        </label>
      </section>

      <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Reminder ID</p>
          <p className="text-sm font-medium text-[#1A1A18]">{reminder.id}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Sent At</p>
          <p className="text-sm font-medium text-[#1A1A18]">
            {reminder.sentAt ? new Date(reminder.sentAt).toLocaleString("en-GB") : "Not sent yet"}
          </p>
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
