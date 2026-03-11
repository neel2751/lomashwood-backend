import { Suspense } from 'react'

import Link from 'next/link'

import { AppointmentsOverview } from '@/components/appointments/AppointmentsOverview'
import { PageHeader } from '@/components/layout/PageHeader'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Appointments' }

const APPT_SUBNAV = [
  { href: '/appointments', label: 'All Appointments' },
  { href: '/appointments/calendar', label: 'Calendar' },
  { href: '/appointments/availability', label: 'Availability' },
  { href: '/appointments/consultants', label: 'Consultants' },
  { href: '/appointments/showrooms', label: 'Showrooms' },
  { href: '/appointments/reminders', label: 'Reminders' },
]

export default function AppointmentsPage() {
  return (
    <div className="appts-page">
      <div className="appts-page__topbar">
        <PageHeader
          title="Appointments"
          description="Manage home measurements, online consultations, and showroom visits."
        />
        <div className="appts-page__actions">
          <button className="btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <nav className="subnav">
        {APPT_SUBNAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={`subnav__item${item.href === '/appointments' ? ' subnav__item--active' : ''}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<div className="table-skeleton" />}>
        <AppointmentsOverview />
      </Suspense>

      <style>{`
        .appts-page { display: flex; flex-direction: column; gap: 24px; }

        .appts-page__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .appts-page__actions { padding-top: 4px; }

        .btn-outline { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; background: #FFFFFF; color: #1A1A18; border: 1.5px solid #E8E6E1; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.15s; }
        .btn-outline:hover { border-color: #1A1A18; }

        .subnav { display: flex; gap: 2px; border-bottom: 1.5px solid #E8E6E1; overflow-x: auto; }
        .subnav__item { height: 38px; padding: 0 14px; display: flex; align-items: center; font-size: 0.875rem; font-weight: 500; color: #6B6B68; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; white-space: nowrap; transition: color 0.15s; }
        .subnav__item:hover { color: #1A1A18; }
        .subnav__item--active { color: #1A1A18; font-weight: 600; border-bottom-color: #1A1A18; }

        .appts-page__stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
        @media (max-width: 1200px) { .appts-page__stats { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .appts-page__stats { grid-template-columns: repeat(2, 1fr); } }

        .stat-tile { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
        .stat-tile__label { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }
        .stat-tile__row { display: flex; align-items: baseline; gap: 6px; }
        .stat-tile__value { font-size: 1.625rem; font-weight: 700; color: #1A1A18; font-variant-numeric: tabular-nums; }
        .appts-page__layout { display: grid; grid-template-columns: 1.4fr 450px; gap: 24px; align-items: start; }
        @media (max-width: 1400px) { .appts-page__layout { grid-template-columns: 1fr 400px; } }
        @media (max-width: 1100px) { .appts-page__layout { grid-template-columns: 1fr; } }

        .appts-page__table-col { display: flex; flex-direction: column; gap: 14px; }
        .appts-page__calendar-col { display: flex; flex-direction: column; gap: 14px; min-height: 600px; }

        .section-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; margin-bottom: 12px; }

        .table-skeleton { height: 480px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .calendar-skeleton { height: 340px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}

export const dynamic = 'force-dynamic'
