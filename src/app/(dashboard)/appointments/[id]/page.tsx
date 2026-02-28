import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppointmentDetail } from '@/components/appointments/AppointmentDetail'
import { AppointmentTimeline } from '@/components/appointments/AppointmentTimeline'

type Props = { params: { id: string } }

const APPOINTMENTS: Record<string, {
  customerName: string
  email: string
  phone: string
  postcode: string
  address: string
  type: 'home' | 'online' | 'showroom'
  rooms: string[]
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  date: string
  time: string
  consultant: string
  showroom: string | null
  notes: string
  createdAt: string
}> = {
  'appt-001': { customerName: 'Eleanor Whitfield', email: 'eleanor@example.com', phone: '07712 345678', postcode: 'SW1A 1AA', address: '14 Belgrave Square, London', type: 'home', rooms: ['Kitchen', 'Bedroom'], status: 'confirmed', date: '28 Feb 2026', time: '10:00 AM', consultant: 'James Thornton', showroom: null, notes: 'Customer wants to discuss open-plan kitchen extension.', createdAt: '20 Feb 2026' },
  'appt-002': { customerName: 'Marcus Chen', email: 'marcus@example.com', phone: '07889 123456', postcode: 'M1 4BT', address: '', type: 'online', rooms: ['Bedroom'], status: 'pending', date: '1 Mar 2026', time: '2:30 PM', consultant: 'Sarah Mitchell', showroom: null, notes: '', createdAt: '22 Feb 2026' },
  'appt-003': { customerName: 'Priya Sharma', email: 'priya@example.com', phone: '07456 789012', postcode: 'B1 1BB', address: '', type: 'showroom', rooms: ['Kitchen'], status: 'confirmed', date: '2 Mar 2026', time: '11:30 AM', consultant: 'David Walsh', showroom: 'Birmingham Showroom', notes: 'First-time visitor. Interested in handle-less range.', createdAt: '24 Feb 2026' },
}

const TYPE_CONFIG = {
  home:     { color: '#8B6914', bg: '#FFF8E6', label: 'Home Measurement', icon: '🏠' },
  online:   { color: '#2980B9', bg: '#EBF4FB', label: 'Online',           icon: '💻' },
  showroom: { color: '#27AE60', bg: '#EAF7EF', label: 'Showroom',         icon: '🏪' },
}

const STATUS_CONFIG = {
  confirmed: { color: '#27AE60', bg: '#EAF7EF', label: 'Confirmed' },
  pending:   { color: '#D4820A', bg: '#FFF3DC', label: 'Pending' },
  completed: { color: '#6B6B68', bg: '#F0EDE8', label: 'Completed' },
  cancelled: { color: '#C0392B', bg: '#FDF2F2', label: 'Cancelled' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const appt = APPOINTMENTS[params.id]
  return { title: appt ? `${appt.customerName} — Appointment` : 'Appointment' }
}

export default function AppointmentDetailPage({ params }: Props) {
  const appt = APPOINTMENTS[params.id]
  if (!appt) notFound()

  const typeConf   = TYPE_CONFIG[appt.type]
  const statusConf = STATUS_CONFIG[appt.status]

  return (
    <div className="appt-detail">
      <div className="appt-detail__topbar">
        <PageHeader
          title={appt.customerName}
          description={`${typeConf.label} · ${appt.date} at ${appt.time}`}
          backHref="/appointments"
          backLabel="Appointments"
        />
        <div className="appt-detail__actions">
          {appt.status === 'pending' && (
            <button className="btn-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Confirm
            </button>
          )}
          {appt.status !== 'cancelled' && appt.status !== 'completed' && (
            <button className="btn-danger-ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancel
            </button>
          )}
          <button className="btn-primary">Edit</button>
        </div>
      </div>

      <div className="appt-detail__hero">
        <div className="appt-hero-badge" style={{ background: typeConf.bg, borderColor: typeConf.color }}>
          <span className="appt-hero-badge__icon">{typeConf.icon}</span>
          <span className="appt-hero-badge__label" style={{ color: typeConf.color }}>{typeConf.label}</span>
        </div>
        <div className="appt-hero-datetime">
          <span className="appt-hero-datetime__date">{appt.date}</span>
          <span className="appt-hero-datetime__sep" aria-hidden="true">·</span>
          <span className="appt-hero-datetime__time">{appt.time}</span>
        </div>
        <div className="appt-hero-rooms">
          {appt.rooms.map(room => (
            <span key={room} className={`room-pill room-pill--${room.toLowerCase()}`}>{room}</span>
          ))}
        </div>
        <span className="appt-hero-status" style={{ color: statusConf.color, background: statusConf.bg }}>
          {statusConf.label}
        </span>
      </div>

      <div className="appt-detail__layout">
        <div className="appt-detail__main">
          <div className="info-card">
            <h2 className="info-card__title">Customer Details</h2>
            <div className="info-grid">
              {[
                { label: 'Name',    value: appt.customerName },
                { label: 'Email',   value: appt.email,   href: `mailto:${appt.email}` },
                { label: 'Phone',   value: appt.phone,   href: `tel:${appt.phone}` },
                { label: 'Postcode',value: appt.postcode },
                ...(appt.address ? [{ label: 'Address', value: appt.address }] : []),
              ].map(({ label, value, href }) => (
                <div key={label} className="info-row">
                  <span className="info-row__label">{label}</span>
                  {href
                    ? <a href={href} className="info-row__link">{value}</a>
                    : <span className="info-row__value">{value}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="info-card">
            <h2 className="info-card__title">Appointment Details</h2>
            <div className="info-grid">
              {[
                { label: 'Type',       value: typeConf.label },
                { label: 'Rooms',      value: appt.rooms.join(' & ') },
                { label: 'Date',       value: appt.date },
                { label: 'Time',       value: appt.time },
                { label: 'Consultant', value: appt.consultant },
                ...(appt.showroom ? [{ label: 'Showroom', value: appt.showroom }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="info-row">
                  <span className="info-row__label">{label}</span>
                  <span className="info-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {appt.notes && (
            <div className="info-card">
              <h2 className="info-card__title">Notes</h2>
              <p className="notes-text">{appt.notes}</p>
            </div>
          )}

          <div className="timeline-section">
            <h2 className="section-label">Activity Timeline</h2>
            <Suspense fallback={<div className="timeline-skeleton" />}>
              <AppointmentTimeline appointmentId={params.id} />
            </Suspense>
          </div>
        </div>

        <aside className="appt-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Quick Actions</h3>
            <div className="sidebar-actions">
              {[
                { icon: '📧', label: 'Send reminder email', href: `/appointments/${params.id}/remind` },
                { icon: '📅', label: 'Reschedule', href: `/appointments/${params.id}/reschedule` },
                { icon: '👤', label: 'View customer', href: `/customers/${appt.email}` },
                { icon: '🖨', label: 'Print summary', href: '#' },
              ].map(({ icon, label, href }) => (
                <Link key={label} href={href} className="sidebar-quick-action">
                  <span className="sidebar-quick-action__icon">{icon}</span>
                  <span>{label}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sidebar-quick-action__arrow">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Booking Info</h3>
            {[
              { key: 'Booking ID', val: params.id },
              { key: 'Created', val: appt.createdAt },
              { key: 'Status', val: statusConf.label },
            ].map(({ key, val }) => (
              <div key={key} className="sidebar-info-row">
                <span className="sidebar-info-key">{key}</span>
                <span className="sidebar-info-val">{val}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        .appt-detail { display: flex; flex-direction: column; gap: 24px; }

        .appt-detail__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .appt-detail__actions { display: flex; gap: 10px; padding-top: 4px; align-items: center; flex-wrap: wrap; }

        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #2E2E2A; }
        .btn-success { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #27AE60; color: #fff; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-success:hover { background: #229A55; }
        .btn-danger-ghost { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; background: none; border: 1.5px solid #F5C6C6; border-radius: 8px; color: #C0392B; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-danger-ghost:hover { background: #FDF2F2; }

        .appt-detail__hero { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 18px 20px; background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; }

        .appt-hero-badge { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1.5px solid; border-radius: 10px; }
        .appt-hero-badge__icon { font-size: 1rem; }
        .appt-hero-badge__label { font-size: 0.875rem; font-weight: 600; }

        .appt-hero-datetime { display: flex; align-items: center; gap: 8px; }
        .appt-hero-datetime__date { font-size: 0.9375rem; font-weight: 600; color: #1A1A18; }
        .appt-hero-datetime__sep { color: #B8B5AE; }
        .appt-hero-datetime__time { font-size: 0.9375rem; color: #6B6B68; }

        .appt-hero-rooms { display: flex; gap: 6px; }
        .room-pill { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .room-pill--kitchen { color: #2980B9; background: #EBF4FB; }
        .room-pill--bedroom { color: #8B6914; background: #FFF8E6; }

        .appt-hero-status { font-size: 0.8125rem; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-left: auto; }

        .appt-detail__layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .appt-detail__layout { grid-template-columns: 1fr; } }

        .appt-detail__main { display: flex; flex-direction: column; gap: 16px; }

        .info-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 16px; }
        .info-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; }

        .info-grid { display: flex; flex-direction: column; gap: 0; }
        .info-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F5F3EF; }
        .info-row:last-child { border-bottom: none; }
        .info-row__label { font-size: 0.8125rem; color: #6B6B68; flex-shrink: 0; min-width: 100px; }
        .info-row__value { font-size: 0.875rem; font-weight: 500; color: #1A1A18; text-align: right; }
        .info-row__link { font-size: 0.875rem; font-weight: 500; color: #8B6914; text-decoration: none; text-align: right; }
        .info-row__link:hover { text-decoration: underline; }

        .notes-text { font-size: 0.9375rem; color: #1A1A18; line-height: 1.65; }

        .section-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; margin-bottom: 12px; }
        .timeline-skeleton { height: 200px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }

        .sidebar-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
        .sidebar-card:last-child { margin-bottom: 0; }
        .sidebar-card__title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }

        .sidebar-actions { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-quick-action { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; text-decoration: none; color: #1A1A18; font-size: 0.875rem; font-weight: 500; transition: background 0.15s; }
        .sidebar-quick-action:hover { background: #F5F3EF; }
        .sidebar-quick-action__icon { font-size: 1rem; flex-shrink: 0; }
        .sidebar-quick-action__arrow { margin-left: auto; color: #B8B5AE; }

        .sidebar-info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5F3EF; }
        .sidebar-info-row:last-child { border-bottom: none; }
        .sidebar-info-key { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-info-val { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; font-family: 'DM Mono', monospace; font-size: 0.75rem; }

        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}