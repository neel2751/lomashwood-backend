"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  XCircle,
  CalendarCheck,
  Phone,
  Mail,
  RotateCcw,
} from "lucide-react";

import { useSendAppointmentEmail, useUpdateAppointment } from "@/hooks/useAppointments";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
type AppointmentType = "home" | "showroom" | "online";

type AppointmentRecord = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: AppointmentType;
  consultantName?: string;
  forKitchen: boolean;
  forBedroom: boolean;
  slot: string;
  status: AppointmentStatus;
  notes?: string;
  confirmationEmailSentAt?: string;
  reminderEmailSentAt?: string;
  missedEmailSentAt?: string;
};

type Props = {
  appointments: AppointmentRecord[];
  search: string;
  typeFilter: "All" | AppointmentType;
  statusFilter: "All" | AppointmentStatus;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: "All" | AppointmentType) => void;
  onStatusFilterChange: (value: "All" | AppointmentStatus) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
};

const TYPE_CONFIG: Record<AppointmentType, { label: string; bg: string; text: string }> = {
  home: { label: "Home Visit", bg: "bg-[#C8924A]/15", text: "text-[#C8924A]" },
  showroom: { label: "Showroom", bg: "bg-[#6B8A9A]/15", text: "text-[#6B8A9A]" },
  online: { label: "Online", bg: "bg-emerald-400/10", text: "text-emerald-400" },
};

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: { label: "Pending", bg: "bg-[#6B8A9A]/15", text: "text-[#6B8A9A]", dot: "bg-[#6B8A9A]" },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-400/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  cancelled: { label: "Cancelled", bg: "bg-red-400/10", text: "text-red-400", dot: "bg-red-400" },
  no_show: { label: "No Show", bg: "bg-amber-400/10", text: "text-amber-400", dot: "bg-amber-400" },
};

function getInterestLabel(item: AppointmentRecord) {
  if (item.forKitchen && item.forBedroom) return "Both";
  if (item.forKitchen) return "Kitchen";
  if (item.forBedroom) return "Bedroom";
  return "General";
}

function getDuration(item: AppointmentRecord) {
  if (item.type === "home") return 90;
  if (item.type === "online") return 45;
  return 60;
}

function formatSentAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AppointmentTable({
  appointments,
  search,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  hasActiveFilters,
  onClearFilters,
  page,
  totalPages,
  onPageChange,
  total,
  isLoading,
  isError,
  error,
}: Props) {
  const toast = useToast();
  const updateAppointment = useUpdateAppointment();
  const sendAppointmentEmail = useSendAppointmentEmail();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => appointments, [appointments]);

  const toggleSelect = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((item) => item.id));

  async function handleCancel(appointmentId: string) {
    try {
      await updateAppointment.mutateAsync({ id: appointmentId, payload: { status: "cancelled" } });
      toast.success("Appointment cancelled");
      setOpenMenu(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel appointment";
      toast.error("Failed to cancel appointment", message);
    }
  }

  async function handleSendEmail(
    appointmentId: string,
    type: "confirmation" | "reminder" | "missed",
  ) {
    try {
      await sendAppointmentEmail.mutateAsync({ id: appointmentId, type });
      toast.success(
        type === "confirmation"
          ? "Confirmation email sent"
          : type === "reminder"
            ? "Reminder email sent"
            : "Missed appointment email sent",
      );
      setOpenMenu(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email";
      toast.error("Failed to send email", message);
    }
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E6E1] px-5 py-4">
        <div className="relative w-full sm:w-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39A]" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer, consultant…"
            className="h-9 w-full rounded-[9px] border border-[#E8E6E1] bg-white pl-8 pr-3 text-[12.5px] text-[#1A1A18] placeholder:text-[#A8A39A] focus:border-[#8B6914]/30 focus:outline-none sm:w-[240px]"
          />
        </div>

        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39A]" />
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as "All" | AppointmentType)}
            className="h-9 appearance-none rounded-[9px] border border-[#E8E6E1] bg-white pl-8 pr-7 text-[12.5px] text-[#1A1A18] focus:border-[#8B6914]/30 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="home">Home Visit</option>
            <option value="showroom">Showroom</option>
            <option value="online">Online</option>
          </select>
          <ChevronDown
            size={11}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8A39A]"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as "All" | AppointmentStatus)}
            className="h-9 appearance-none rounded-[9px] border border-[#E8E6E1] bg-white px-3 pr-7 text-[12.5px] text-[#1A1A18] focus:border-[#8B6914]/30 focus:outline-none"
          >
            <option value="All">All Status</option>
            {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={11}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8A39A]"
          />
        </div>

        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[#E8E6E1] bg-white px-3 text-[12px] text-[#6B6B68] hover:text-[#1A1A18]"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        )}

        <div className="ml-1 inline-flex items-center gap-1.5 rounded-[9px] border border-[#E8E6E1] bg-[#FAF8F4] px-2.5 py-1.5">
          <span className="text-[10px] text-[#6B6B68]">Email:</span>
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-emerald-400/15 px-1 text-[9px] font-semibold text-emerald-400"
            title="Confirmation email"
          >
            C
          </span>
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-400/15 px-1 text-[9px] font-semibold text-blue-400"
            title="Reminder email"
          >
            R
          </span>
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-amber-400/15 px-1 text-[9px] font-semibold text-amber-400"
            title="Missed appointment email"
          >
            M
          </span>
        </div>

        {selected.length > 0 && (
          <span className="rounded-full bg-[#FFF8E6] px-3 py-1 text-[11px] text-[#8B6914]">
            {selected.length} selected
          </span>
        )}

        <Link
          href="/appointments/new"
          className="ml-auto flex h-9 items-center gap-2 rounded-[9px] bg-[#1A1A18] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#2E2E2A]"
        >
          <CalendarCheck size={14} /> New Appointment
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAF8F4]">
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded accent-[#C8924A]"
                />
              </th>
              {[
                "Customer",
                "Type",
                "Consultant",
                "Interest",
                "Date & Time",
                "Duration",
                "Status",
                "Email",
                "",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6B6B68]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEEA]">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-[13px] text-[#6B6B68]">
                  Loading appointments...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-[13px] text-red-400">
                  Failed to load appointments.{" "}
                  {error instanceof Error ? error.message : "Please try refreshing."}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-[13px] text-[#6B6B68]">
                  <div className="space-y-3">
                    <p>No appointments found for the current filters.</p>
                    {hasActiveFilters && onClearFilters && (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="inline-flex h-8 items-center gap-2 rounded-[8px] border border-[#E8E6E1] bg-white px-3 text-[12px] text-[#6B6B68] hover:text-[#1A1A18]"
                      >
                        <RotateCcw size={12} />
                        Reset filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((appointment) => {
                const type = TYPE_CONFIG[appointment.type];
                const status = STATUS_CONFIG[appointment.status];
                const slotDate = new Date(appointment.slot);
                return (
                  <tr key={appointment.id} className="group transition-colors hover:bg-[#FAF8F4]">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.includes(appointment.id)}
                        onChange={() => toggleSelect(appointment.id)}
                        className="h-4 w-4 cursor-pointer rounded accent-[#C8924A]"
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <Link href={`/appointments/${appointment.id}`}>
                        <p className="text-[13px] font-medium text-[#1A1A18] transition-colors hover:text-[#8B6914]">
                          {appointment.customerName}
                        </p>
                      </Link>
                      <div className="mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10.5px] text-[#6B6B68]">
                          <Mail size={9} /> {appointment.customerEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                          type.bg,
                          type.text,
                        )}
                      >
                        {type.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-[12.5px] text-[#1A1A18]">
                        {appointment.consultantName || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                          getInterestLabel(appointment) === "Kitchen"
                            ? "bg-[#C8924A]/15 text-[#C8924A]"
                            : getInterestLabel(appointment) === "Bedroom"
                              ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                              : "bg-purple-400/10 text-purple-400",
                        )}
                      >
                        {getInterestLabel(appointment)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-[12.5px] font-medium text-[#1A1A18]">
                        {slotDate.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-[#6B6B68]">
                        {slotDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-[12px] text-[#6B6B68]">
                        {getDuration(appointment)} min
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                          status.bg,
                          status.text,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.dot)} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          title={
                            appointment.confirmationEmailSentAt
                              ? `Confirmation sent: ${formatSentAt(appointment.confirmationEmailSentAt)}`
                              : "Confirmation not sent"
                          }
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[9px] font-semibold",
                            appointment.confirmationEmailSentAt
                              ? "bg-emerald-400/15 text-emerald-400"
                              : "bg-[#F3F1EC] text-[#A8A39A]",
                          )}
                        >
                          C
                        </span>
                        <span
                          title={
                            appointment.reminderEmailSentAt
                              ? `Reminder sent: ${formatSentAt(appointment.reminderEmailSentAt)}`
                              : "Reminder not sent"
                          }
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[9px] font-semibold",
                            appointment.reminderEmailSentAt
                              ? "bg-blue-400/15 text-blue-400"
                              : "bg-[#F3F1EC] text-[#A8A39A]",
                          )}
                        >
                          R
                        </span>
                        <span
                          title={
                            appointment.missedEmailSentAt
                              ? `Missed email sent: ${formatSentAt(appointment.missedEmailSentAt)}`
                              : "Missed email not sent"
                          }
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[9px] font-semibold",
                            appointment.missedEmailSentAt
                              ? "bg-amber-400/15 text-amber-400"
                              : "bg-[#F3F1EC] text-[#A8A39A]",
                          )}
                        >
                          M
                        </span>
                      </div>
                    </td>
                    <td className="relative px-3 py-3.5">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === appointment.id ? null : appointment.id)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#6B6B68] opacity-100 transition-all hover:bg-[#F3F1EC] hover:text-[#8B6914] md:opacity-0 md:group-hover:opacity-100"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {openMenu === appointment.id && (
                        <div className="absolute right-3 top-full z-20 mt-1 w-[220px] overflow-hidden rounded-[10px] border border-[#E8E6E1] bg-white shadow-xl">
                          {[
                            { icon: Eye, label: "View", href: `/appointments/${appointment.id}` },
                            {
                              icon: Pencil,
                              label: "Edit",
                              href: `/appointments/${appointment.id}/edit`,
                            },
                            {
                              icon: Phone,
                              label: "Call",
                              href: `tel:${appointment.customerPhone}`,
                            },
                          ].map(({ icon: Icon, label, href }) => (
                            <Link
                              key={label}
                              href={href}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#1A1A18] transition-all hover:bg-[#FAF8F4] hover:text-[#8B6914]"
                            >
                              <Icon size={13} /> {label}
                            </Link>
                          ))}
                          <button
                            onClick={() => void handleSendEmail(appointment.id, "reminder")}
                            className="flex w-full items-center gap-2.5 border-t border-[#E8E6E1] px-3 py-2 text-[12.5px] text-[#1A1A18] transition-all hover:bg-[#FAF8F4] hover:text-[#8B6914]"
                          >
                            <Mail size={13} /> Send Reminder Email
                          </button>
                          <button
                            onClick={() => void handleSendEmail(appointment.id, "confirmation")}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#1A1A18] transition-all hover:bg-[#FAF8F4] hover:text-[#8B6914]"
                          >
                            <Mail size={13} /> Send Confirmation Email
                          </button>
                          <button
                            onClick={() => void handleSendEmail(appointment.id, "missed")}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#1A1A18] transition-all hover:bg-[#FAF8F4] hover:text-[#8B6914]"
                          >
                            <Mail size={13} /> Send Missed Email
                          </button>
                          <button
                            onClick={() => void handleCancel(appointment.id)}
                            className="flex w-full items-center gap-2.5 border-t border-[#E8E6E1] px-3 py-2 text-[12.5px] text-red-600 transition-all hover:bg-red-50"
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#E8E6E1] px-5 py-3">
        <span className="text-[12px] text-[#6B6B68]">
          Showing {filtered.length} of {total} appointments
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-7 rounded-[6px] border border-[#E8E6E1] px-2 text-[12px] text-[#1A1A18] disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          <span className="text-[12px] text-[#6B6B68]">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            className="h-7 rounded-[6px] border border-[#E8E6E1] px-2 text-[12px] text-[#1A1A18] disabled:opacity-40"
            disabled={page >= Math.max(totalPages, 1)}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
