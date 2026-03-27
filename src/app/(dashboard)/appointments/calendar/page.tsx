import { Suspense } from "react";

import Link from "next/link";

import { AppointmentCalendarView } from "@/components/appointments/AppointmentCalendarView";
import { PageHeader } from "@/components/layout/PageHeader";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Appointments Calendar" };

const APPT_SUBNAV = [
  { href: "/appointments", label: "All Appointments" },
  { href: "/appointments/calendar", label: "Calendar" },
  { href: "/appointments/availability", label: "Availability" },
  { href: "/appointments/consultants", label: "Consultants" },
  { href: "/appointments/reminders", label: "Reminders" },
];

export default function AppointmentsCalendarPage() {
  return (
    <div className="appts-page">
      <div className="appts-page__topbar">
        <PageHeader title="Appointments" description="View all appointments in calendar format." />
      </div>

      <nav className="subnav">
        {APPT_SUBNAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === "/appointments/calendar" ? "subnav__item--active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Suspense fallback={<div className="calendar-skeleton" />}>
        <AppointmentCalendarView />
      </Suspense>

      <style>{`
        .appts-page { display: flex; flex-direction: column; gap: 24px; }

        .appts-page__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

        .subnav { display: flex; gap: 2px; border-bottom: 1.5px solid #E8E6E1; overflow-x: auto; }
        .subnav__item { height: 38px; padding: 0 14px; display: flex; align-items: center; font-size: 0.875rem; font-weight: 500; color: #6B6B68; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; white-space: nowrap; transition: color 0.15s; }
        .subnav__item:hover { color: #1A1A18; }
        .subnav__item--active { color: #1A1A18; font-weight: 600; border-bottom-color: #1A1A18; }

        .calendar-skeleton { height: 600px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

export const dynamic = "force-dynamic";
