"use client";

import { useState } from "react";

import { AppointmentTable } from "@/components/appointments/AppointmentTable";
import { useAppointments } from "@/hooks/useAppointments";

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
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  consultantId?: string;
  consultantName?: string;
  showroomId?: string;
  showroomName?: string;
  notes?: string;
  confirmationEmailSentAt?: string;
  reminderEmailSentAt?: string;
  missedEmailSentAt?: string;
  createdAt: string;
  updatedAt: string;
};

function isSameDay(date: Date, compare: Date) {
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

export function AppointmentsOverview() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "home" | "online" | "showroom">("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
  >("All");
  const [page, setPage] = useState(1);
  const limit = 20;

  const appointmentsQuery = useAppointments({
    page,
    limit,
    search: search || undefined,
    type: typeFilter === "All" ? undefined : typeFilter,
    status: statusFilter === "All" ? undefined : statusFilter,
  });
  const appointments = ((appointmentsQuery.data as { data?: AppointmentRecord[] } | undefined)
    ?.data ?? []) as AppointmentRecord[];
  const pagination = appointmentsQuery.data as
    | { total?: number; page?: number; totalPages?: number }
    | undefined;
  const now = new Date();

  const stats = {
    totalResults: pagination?.total ?? appointments.length,
    home: appointments.filter((item) => item.type === "home").length,
    online: appointments.filter((item) => item.type === "online").length,
    showroom: appointments.filter((item) => item.type === "showroom").length,
    pending: appointments.filter((item) => item.status === "pending").length,
    today: appointments.filter((item) => isSameDay(new Date(item.slot), now)).length,
  };

  const hasActiveFilters = Boolean(search || typeFilter !== "All" || statusFilter !== "All");

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
    setStatusFilter("All");
    setPage(1);
  }

  return (
    <>
      <div className="appts-page__stats">
        {[
          { label: "Total Results", value: stats.totalResults },
          { label: "This Page • Home", value: stats.home },
          { label: "This Page • Online", value: stats.online },
          { label: "This Page • Showroom", value: stats.showroom },
          { label: "This Page • Pending", value: stats.pending, color: "#D4820A", bg: "#FFF3DC" },
          { label: "Today (Page)", value: stats.today, color: "#2980B9", bg: "#EBF4FB" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="stat-tile"
            style={bg ? { background: bg, borderColor: color } : {}}
          >
            <span className="stat-tile__label">{label}</span>
            <div className="stat-tile__row">
              <span className="stat-tile__value" style={color ? { color } : {}}>
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="appts-page__table-wrapper">
        <AppointmentTable
          appointments={appointments}
          search={search}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onSearchChange={(value) => {
            setPage(1);
            setSearch(value);
          }}
          onTypeFilterChange={(value) => {
            setPage(1);
            setTypeFilter(value);
          }}
          onStatusFilterChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          page={pagination?.page ?? page}
          totalPages={pagination?.totalPages ?? 1}
          onPageChange={(next) => setPage(next)}
          total={pagination?.total ?? appointments.length}
          isLoading={appointmentsQuery.isLoading}
          isError={appointmentsQuery.isError}
          error={appointmentsQuery.error}
        />
      </div>

      <style>{`
        .appts-page__table-wrapper {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
      `}</style>
    </>
  );
}
