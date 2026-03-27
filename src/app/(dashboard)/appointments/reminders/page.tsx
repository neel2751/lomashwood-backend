"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { useReminders, useUpdateReminder } from "@/hooks/useReminders";
import { useToast } from "@/hooks/use-toast";

type ReminderRecord = {
  id: string;
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

const APPT_SUBNAV = [
  { href: "/appointments", label: "All Appointments" },
  { href: "/appointments/calendar", label: "Calendar" },
  { href: "/appointments/availability", label: "Availability" },
  { href: "/appointments/consultants", label: "Consultants" },
  { href: "/appointments/reminders", label: "Reminders" },
];

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
} as const;

const TYPE_STYLES = {
  email: "bg-[#EBF4FB] text-[#2980B9]",
  sms: "bg-[#EAF7EF] text-[#27AE60]",
} as const;

export default function RemindersListPage() {
  const toast = useToast();
  const remindersQuery = useReminders();
  const updateReminder = useUpdateReminder();

  const reminders = ((remindersQuery.data as { data?: ReminderRecord[] } | undefined)?.data ??
    []) as ReminderRecord[];

  const pendingCount = reminders.filter((item) => item.status === "pending").length;
  const sentCount = reminders.filter((item) => item.status === "sent").length;
  const failedCount = reminders.filter((item) => item.status === "failed").length;

  async function toggleStatus(reminder: ReminderRecord) {
    const nextStatus = reminder.status === "pending" ? "failed" : "pending";
    try {
      await updateReminder.mutateAsync({ id: reminder.id, payload: { status: nextStatus } });
      toast.success("Reminder updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update reminder";
      toast.error("Failed to update reminder", message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Reminders"
          description="Track and manage scheduled reminder deliveries."
        />
      </div>

      <nav className="subnav">
        {APPT_SUBNAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === "/appointments/reminders" ? "subnav__item--active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {[
          { label: "Total", value: reminders.length },
          { label: "Pending", value: pendingCount },
          { label: "Sent", value: sentCount },
          { label: "Failed", value: failedCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[12px] border border-[#E8E6E1] bg-white px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6B68]">
              {item.label}
            </p>
            <p className="mt-1 text-[22px] font-bold text-[#1A1A18]">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[14px] border border-[#E8E6E1] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAF8F4]">
                {[
                  "Customer",
                  "Appointment",
                  "Channel",
                  "Status",
                  "Scheduled",
                  "Sent",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6B6B68]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEEA]">
              {remindersQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#6B6B68]">
                    Loading reminders...
                  </td>
                </tr>
              ) : remindersQuery.isError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-red-600">
                    Failed to load reminders.
                  </td>
                </tr>
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#6B6B68]">
                    No reminders found.
                  </td>
                </tr>
              ) : (
                reminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-[#FAF8F4]">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#1A1A18]">
                        {reminder.appointment?.customerName ?? "Unknown customer"}
                      </p>
                      <p className="text-[11px] text-[#6B6B68]">
                        {reminder.appointment?.customerEmail ?? "No email"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[12px] capitalize text-[#1A1A18]">
                      {reminder.appointment?.type ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLES[reminder.type]}`}
                      >
                        {reminder.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[reminder.status]}`}
                      >
                        {reminder.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#1A1A18]">
                      {new Date(reminder.scheduledAt).toLocaleString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6B68]">
                      {reminder.sentAt
                        ? new Date(reminder.sentAt).toLocaleString("en-GB")
                        : "Not sent"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/appointments/reminders/${reminder.id}`}
                          className="text-[12px] font-medium text-[#1A1A18] underline"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => void toggleStatus(reminder)}
                          className="text-[12px] font-medium text-[#8B6914]"
                        >
                          {reminder.status === "pending" ? "Mark failed" : "Set pending"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
