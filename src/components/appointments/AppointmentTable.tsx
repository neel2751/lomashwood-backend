"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  Search, Filter, ChevronDown, MoreHorizontal,
  Eye, Pencil, XCircle, CalendarCheck, Phone, Mail,
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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "Pending", bg: "bg-[#6B8A9A]/15", text: "text-[#6B8A9A]", dot: "bg-[#6B8A9A]" },
  confirmed: { label: "Confirmed", bg: "bg-blue-400/10", text: "text-blue-400", dot: "bg-blue-400" },
  completed: { label: "Completed", bg: "bg-emerald-400/10", text: "text-emerald-400", dot: "bg-emerald-400" },
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
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

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
    type: "confirmation" | "reminder" | "missed"
  ) {
    try {
      await sendAppointmentEmail.mutateAsync({ id: appointmentId, type });
      toast.success(type === "confirmation" ? "Confirmation email sent" : type === "reminder" ? "Reminder email sent" : "Missed appointment email sent");
      setOpenMenu(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email";
      toast.error("Failed to send email", message);
    }
  }

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer, consultant…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[220px]"
          />
        </div>

        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value as "All" | AppointmentType)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Types</option>
            <option value="home">Home Visit</option>
            <option value="showroom">Showroom</option>
            <option value="online">Online</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <div className="relative">
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as "All" | AppointmentStatus)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Status</option>
            {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((status) => (
              <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <div className="ml-1 inline-flex items-center gap-1.5 rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] px-2.5 py-1.5">
          <span className="text-[10px] text-[#9A7A5A]">Email:</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-emerald-400/15 px-1 text-[9px] font-semibold text-emerald-400" title="Confirmation email">C</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-400/15 px-1 text-[9px] font-semibold text-blue-400" title="Reminder email">R</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-amber-400/15 px-1 text-[9px] font-semibold text-amber-400" title="Missed appointment email">M</span>
        </div>

        {selected.length > 0 && (
          <span className="text-[11px] text-[#C8924A] bg-[#C8924A]/10 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
        )}

        <Link href="/appointments/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors">
          <CalendarCheck size={14} /> New Appointment
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              <th className="px-5 py-3 w-10">
                <input type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
              </th>
              {["Customer", "Type", "Consultant", "Interest", "Date & Time", "Duration", "Status", "Email", ""].map((heading) => (
                <th key={heading} className="px-3 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-[#5A4232]">Loading appointments...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-red-400">
                  Failed to load appointments. {error instanceof Error ? error.message : 'Please try refreshing.'}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-[#5A4232]">No appointments found.</td>
              </tr>
            ) : (
              filtered.map((appointment) => {
                const type = TYPE_CONFIG[appointment.type];
                const status = STATUS_CONFIG[appointment.status];
                const slotDate = new Date(appointment.slot);
                return (
                  <tr key={appointment.id} className="group hover:bg-[#221A12] transition-colors">
                    <td className="px-5 py-3.5">
                      <input type="checkbox" checked={selected.includes(appointment.id)} onChange={() => toggleSelect(appointment.id)} className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer" />
                    </td>
                    <td className="px-3 py-3.5">
                      <Link href={`/appointments/${appointment.id}`}>
                        <p className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">{appointment.customerName}</p>
                      </Link>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10.5px] text-[#5A4232]">
                          <Mail size={9} /> {appointment.customerEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", type.bg, type.text)}>{type.label}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-[12.5px] text-[#7A6045]">{appointment.consultantName || 'Unassigned'}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={cn(
                        "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                        getInterestLabel(appointment) === "Kitchen" ? "bg-[#C8924A]/15 text-[#C8924A]"
                          : getInterestLabel(appointment) === "Bedroom" ? "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                          : "bg-purple-400/10 text-purple-400"
                      )}>{getInterestLabel(appointment)}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-[12.5px] font-medium text-[#C8B99A]">{slotDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      <p className="text-[11px] text-[#5A4232]">{slotDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-[12px] text-[#5A4232]">{getDuration(appointment)} min</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-medium", status.bg, status.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dot)} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          title={appointment.confirmationEmailSentAt ? `Confirmation sent: ${formatSentAt(appointment.confirmationEmailSentAt)}` : "Confirmation not sent"}
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded text-[9px] font-semibold px-1",
                            appointment.confirmationEmailSentAt ? "bg-emerald-400/15 text-emerald-400" : "bg-[#2E231A] text-[#5A4232]"
                          )}
                        >
                          C
                        </span>
                        <span
                          title={appointment.reminderEmailSentAt ? `Reminder sent: ${formatSentAt(appointment.reminderEmailSentAt)}` : "Reminder not sent"}
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded text-[9px] font-semibold px-1",
                            appointment.reminderEmailSentAt ? "bg-blue-400/15 text-blue-400" : "bg-[#2E231A] text-[#5A4232]"
                          )}
                        >
                          R
                        </span>
                        <span
                          title={appointment.missedEmailSentAt ? `Missed email sent: ${formatSentAt(appointment.missedEmailSentAt)}` : "Missed email not sent"}
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded text-[9px] font-semibold px-1",
                            appointment.missedEmailSentAt ? "bg-amber-400/15 text-amber-400" : "bg-[#2E231A] text-[#5A4232]"
                          )}
                        >
                          M
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 relative">
                      <button onClick={() => setOpenMenu(openMenu === appointment.id ? null : appointment.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#3D2E1E] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={14} />
                      </button>
                      {openMenu === appointment.id && (
                        <div className="absolute right-3 top-full mt-1 z-20 w-[220px] bg-[#1C1611] border border-[#2E231A] rounded-[10px] shadow-xl overflow-hidden">
                          {[
                            { icon: Eye, label: "View", href: `/appointments/${appointment.id}` },
                            { icon: Pencil, label: "Edit", href: `/appointments/${appointment.id}/edit` },
                            { icon: Phone, label: "Call", href: `tel:${appointment.customerPhone}` },
                          ].map(({ icon: Icon, label, href }) => (
                            <Link key={label} href={href} onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                              <Icon size={13} /> {label}
                            </Link>
                          ))}
                          <button
                            onClick={() => void handleSendEmail(appointment.id, "reminder")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all border-t border-[#2E231A]"
                          >
                            <Mail size={13} /> Send Reminder Email
                          </button>
                          <button
                            onClick={() => void handleSendEmail(appointment.id, "confirmation")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
                          >
                            <Mail size={13} /> Send Confirmation Email
                          </button>
                          <button
                            onClick={() => void handleSendEmail(appointment.id, "missed")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
                          >
                            <Mail size={13} /> Send Missed Email
                          </button>
                          <button
                            onClick={() => void handleCancel(appointment.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-red-400 hover:bg-red-400/10 transition-all border-t border-[#2E231A]"
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

      <div className="px-5 py-3 border-t border-[#2E231A] flex items-center justify-between">
        <span className="text-[12px] text-[#5A4232]">{total} appointments</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-7 px-2 rounded-[6px] border border-[#3D2E1E] text-[12px] text-[#7A6045] disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          <span className="text-[12px] text-[#3D2E1E]">Page {page} of {Math.max(totalPages, 1)}</span>
          <button
            type="button"
            className="h-7 px-2 rounded-[6px] border border-[#3D2E1E] text-[12px] text-[#7A6045] disabled:opacity-40"
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