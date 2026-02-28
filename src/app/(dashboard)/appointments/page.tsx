import { Suspense } from 'react'

import Link from 'next/link'

import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar'
import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { PageHeader } from '@/components/layout/PageHeader'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Appointments' }

const APPT_SUBNAV = [
  { href: '/appointments', label: 'All Appointments' },
  { href: '/appointments/availability', label: 'Availability' },
  { href: '/appointments/consultants', label: 'Consultants' },
  { href: '/appointments/reminders', label: 'Reminders' },
]

const STATS = [
  { label: 'Total This Month', value: '342', delta: '+12%', trend: 'up' },
  { label: 'Home Measurement', value: '124', sub: '36%' },
  { label: 'Online', value: '98', sub: '29%' },
  { label: 'Showroom', value: '120', sub: '35%' },
  { label: 'Pending Confirmation', value: '18', color: '#D4820A', bg: '#FFF3DC' },
  { label: 'Today', value: '11', color: '#2980B9', bg: '#EBF4FB' },
]

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  home:     { color: '#8B6914', bg: '#FFF8E6', label: 'Home Measurement' },
  online:   { color: '#2980B9', bg: '#EBF4FB', label: 'Online' },
  showroom: { color: '#27AE60', bg: '#EAF7EF', label: 'Showroom' },
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  confirmed: { color: '#27AE60', bg: '#EAF7EF', label: 'Confirmed' },
  pending:   { color: '#D4820A', bg: '#FFF3DC', label: 'Pending' },
  completed: { color: '#6B6B68', bg: '#F0EDE8', label: 'Completed' },
  cancelled: { color: '#C0392B', bg: '#FDF2F2', label: 'Cancelled' },
}

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

      <div className="appts-page__stats">
        {STATS.map(({ label, value, delta, sub, color, bg }) => (
          <div key={label} className="stat-tile" style={bg ? { background: bg, borderColor: color } : {}}>
            <span className="stat-tile__label">{label}</span>
            <div className="stat-tile__row">
              <span className="stat-tile__value" style={color ? { color } : {}}>{value}</span>
              {delta && <span className={`stat-tile__delta${delta.startsWith('+') ? ' stat-tile__delta--up' : ''}`}>{delta}</span>}
              {sub && <span className="stat-tile__sub">{sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="appts-page__layout">
        <div className="appts-page__table-col">
          <div className="appts-page__filters">
            <input type="search" className="filter-search" placeholder="Search name, email, postcode…" />
            <select className="filter-select" defaultValue="">
              <option value="" disabled>Type</option>
              {Object.entries(TYPE_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
            <select className="filter-select" defaultValue="">
              <option value="" disabled>Status</option>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
            <select className="filter-select" defaultValue="">
              <option value="" disabled>Room type</option>
              <option value="kitchen">Kitchen</option>
              <option value="bedroom">Bedroom</option>
              <option value="both">Both</option>
            </select>
            <select className="filter-select" defaultValue="date-desc">
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
            </select>
          </div>

          <Suspense fallback={<div className="table-skeleton" />}>
            <AppointmentTable />
          </Suspense>
        </div>

        <aside className="appts-page__calendar-col">
          <h2 className="section-label">Calendar</h2>
          <Suspense fallback={<div className="calendar-skeleton" />}>
            <AppointmentCalendar />
          </Suspense>
        </aside>
      </div>

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
        .stat-tile__delta { font-size: 0.75rem; font-weight: 600; color: #6B6B68; }
        .stat-tile__delta--up { color: #27AE60; }
        .stat-tile__sub { font-size: 0.75rem; color: #B8B5AE; }

        .appts-page__layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        @media (max-width: 1100px) { .appts-page__layout { grid-template-columns: 1fr; } }

        .appts-page__table-col { display: flex; flex-direction: column; gap: 14px; }

        .appts-page__filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-search { height: 38px; padding: 0 14px; border: 1.5px solid #E8E6E1; border-radius: 8px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; outline: none; min-width: 200px; transition: border-color 0.15s; }
        .filter-search:focus { border-color: #8B6914; box-shadow: 0 0 0 3px rgba(139,105,20,0.1); }
        .filter-search::placeholder { color: #B8B5AE; }
        .filter-select { height: 38px; padding: 0 34px 0 12px; border: 1.5px solid #E8E6E1; border-radius: 8px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; transition: border-color 0.15s; }
        .filter-select:focus { border-color: #8B6914; }

        .section-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; margin-bottom: 12px; }

        .table-skeleton { height: 480px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .calendar-skeleton { height: 340px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}