import { Suspense } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { ConsultantForm } from '@/components/appointments/ConsultantForm'
import { PageHeader } from '@/components/layout/PageHeader'

import type { Metadata } from 'next'

type Props = { params: { id: string } }

const CONSULTANTS: Record<string, {
  name: string
  email: string
  phone: string
  role: string
  showrooms: string[]
  types: string[]
  status: 'active' | 'inactive'
  bio: string
  appointmentsThisMonth: number
  appointmentsTotal: number
  rating: number
  joinedAt: string
  avatar: string
  avatarColor: string
}> = {
  'james-thornton': {
    name: 'James Thornton', email: 'james@lomashwood.co.uk', phone: '07700 900100',
    role: 'Senior Consultant', showrooms: ['London Mayfair'], types: ['home', 'online', 'showroom'],
    status: 'active', bio: 'James has over 12 years of kitchen and bedroom design experience, specialising in open-plan and contemporary styles.',
    appointmentsThisMonth: 48, appointmentsTotal: 842, rating: 4.9, joinedAt: 'Jan 2019', avatar: 'JT', avatarColor: '#8B6914',
  },
  'sarah-mitchell': {
    name: 'Sarah Mitchell', email: 'sarah@lomashwood.co.uk', phone: '07700 900200',
    role: 'Design Consultant', showrooms: ['Manchester'], types: ['online', 'showroom'],
    status: 'active', bio: 'Sarah specialises in bedroom design and has a background in interior architecture.',
    appointmentsThisMonth: 34, appointmentsTotal: 421, rating: 4.8, joinedAt: 'Mar 2021', avatar: 'SM', avatarColor: '#2980B9',
  },
  'david-walsh': {
    name: 'David Walsh', email: 'david@lomashwood.co.uk', phone: '07700 900300',
    role: 'Design Consultant', showrooms: ['Birmingham'], types: ['home', 'showroom'],
    status: 'active', bio: 'David focuses on kitchen design for period properties and listed buildings.',
    appointmentsThisMonth: 29, appointmentsTotal: 310, rating: 4.7, joinedAt: 'Jun 2021', avatar: 'DW', avatarColor: '#27AE60',
  },
  'priya-patel': {
    name: 'Priya Patel', email: 'priya.p@lomashwood.co.uk', phone: '07700 900400',
    role: 'Junior Consultant', showrooms: ['London Mayfair', 'Birmingham'], types: ['online'],
    status: 'active', bio: 'Priya joined the team in 2023 and has quickly built a strong reputation for online consultations.',
    appointmentsThisMonth: 21, appointmentsTotal: 98, rating: 4.6, joinedAt: 'Feb 2023', avatar: 'PP', avatarColor: '#7B3FA0',
  },
  'robert-ford': {
    name: 'Robert Ford', email: 'robert@lomashwood.co.uk', phone: '07700 900500',
    role: 'Senior Consultant', showrooms: ['Manchester'], types: ['home', 'online', 'showroom'],
    status: 'inactive', bio: 'Robert is currently on extended leave.',
    appointmentsThisMonth: 0, appointmentsTotal: 1240, rating: 4.9, joinedAt: 'Sep 2015', avatar: 'RF', avatarColor: '#C0392B',
  },
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  home:     { color: '#8B6914', bg: '#FFF8E6', label: 'Home Measurement' },
  online:   { color: '#2980B9', bg: '#EBF4FB', label: 'Online' },
  showroom: { color: '#27AE60', bg: '#EAF7EF', label: 'Showroom' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = CONSULTANTS[params.id]
  return { title: c ? `${c.name} | Consultants` : 'Consultant | Appointments' }
}

export default function ConsultantDetailPage({ params }: Props) {
  const c = CONSULTANTS[params.id]
  if (!c) notFound()

  return (
    <div className="consultant-detail">
      <div className="consultant-detail__topbar">
        <PageHeader
          title={c.name}
          description={`${c.role} · ${c.showrooms.join(', ')}`}
          backHref="/appointments/consultants"
          backLabel="Consultants"
        />
        <div className="consultant-detail__actions">
          {c.status === 'active'
            ? <button className="btn-ghost-danger">Deactivate</button>
            : <button className="btn-success">Reactivate</button>
          }
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="consultant-hero">
        <div className="consultant-hero__avatar" style={{ background: c.avatarColor }}>
          {c.avatar}
        </div>
        <div className="consultant-hero__info">
          <div className="consultant-hero__name-row">
            <h2 className="consultant-hero__name">{c.name}</h2>
            <span className={`hero-status${c.status === 'inactive' ? ' hero-status--inactive' : ''}`}>
              {c.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="consultant-hero__role">{c.role}</p>
          <div className="consultant-hero__types">
            {c.types.map(t => (
              <span key={t} className="type-pill" style={{ color: TYPE_CONFIG[t].color, background: TYPE_CONFIG[t].bg }}>
                {TYPE_CONFIG[t].label}
              </span>
            ))}
          </div>
          <p className="consultant-hero__bio">{c.bio}</p>
        </div>
        <div className="consultant-hero__kpis">
          {[
            { label: 'This Month', value: c.appointmentsThisMonth.toString() },
            { label: 'All Time', value: c.appointmentsTotal.toLocaleString() },
            { label: 'Rating', value: `${c.rating}★` },
          ].map(({ label, value }) => (
            <div key={label} className="hero-kpi">
              <span className="hero-kpi__value">{value}</span>
              <span className="hero-kpi__label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="consultant-detail__layout">
        <div className="consultant-detail__main">
          <div className="form-card">
            <h2 className="form-card__title">Consultant Details</h2>
            <Suspense fallback={<div className="form-skeleton" />}>
              <ConsultantForm
                consultantId={params.id}
                defaultValues={{
                  name: c.name, email: c.email, phone: c.phone,
                  role: c.role, showrooms: c.showrooms, types: c.types, bio: c.bio,
                }}
              />
            </Suspense>
          </div>

          <div className="appointments-section">
            <h2 className="section-label">Upcoming Appointments ({c.appointmentsThisMonth})</h2>
            <Suspense fallback={<div className="table-skeleton" />}>
              <AppointmentTable consultantFilter={params.id} />
            </Suspense>
          </div>
        </div>

        <aside className="consultant-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Stats</h3>
            <div className="sidebar-big-stat">
              <span className="sidebar-big-stat__value" style={{ color: c.avatarColor }}>
                {c.appointmentsThisMonth}
              </span>
              <span className="sidebar-big-stat__label">appointments this month</span>
            </div>
            <div className="sidebar-rating">
              <span className="sidebar-rating__value">{c.rating}</span>
              <div className="sidebar-rating__stars" aria-label={`${c.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.floor(c.rating) ? '#C9A84C' : '#E8E6E1'} stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Info</h3>
            {[
              { key: 'Email',   val: c.email },
              { key: 'Phone',   val: c.phone },
              { key: 'Joined',  val: c.joinedAt },
              { key: 'Total',   val: c.appointmentsTotal.toLocaleString() + ' appts' },
            ].map(({ key, val }) => (
              <div key={key} className="sidebar-info-row">
                <span className="sidebar-info-key">{key}</span>
                <span className="sidebar-info-val">{val}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Quick Actions</h3>
            <div className="sidebar-actions">
              <Link href={`/appointments/availability?consultant=${params.id}`} className="sidebar-action-link">
                View availability
              </Link>
              <Link href={`/appointments?consultant=${params.id}`} className="sidebar-action-link">
                All appointments
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .consultant-detail { display: flex; flex-direction: column; gap: 24px; }
        .consultant-detail__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .consultant-detail__actions { display: flex; gap: 10px; padding-top: 4px; }

        .btn-primary { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #2E2E2A; }
        .btn-success { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: #27AE60; color: #fff; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-success:hover { background: #229A55; }
        .btn-ghost-danger { display: inline-flex; align-items: center; height: 38px; padding: 0 14px; background: none; border: 1.5px solid #F5C6C6; border-radius: 8px; color: #C0392B; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-ghost-danger:hover { background: #FDF2F2; }

        .consultant-hero { display: flex; gap: 24px; padding: 24px; background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; align-items: flex-start; flex-wrap: wrap; }

        .consultant-hero__avatar { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; color: #FFFFFF; flex-shrink: 0; }

        .consultant-hero__info { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 200px; }
        .consultant-hero__name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .consultant-hero__name { font-family: 'Playfair Display', Georgia, serif; font-size: 1.375rem; font-weight: 700; color: #1A1A18; }
        .hero-status { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 9px; border-radius: 20px; background: #EAF7EF; color: #27AE60; }
        .hero-status--inactive { background: #F0EDE8; color: #6B6B68; }
        .consultant-hero__role { font-size: 0.9375rem; color: #6B6B68; }
        .consultant-hero__types { display: flex; gap: 6px; flex-wrap: wrap; }
        .type-pill { font-size: 0.6875rem; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
        .consultant-hero__bio { font-size: 0.875rem; color: #6B6B68; line-height: 1.6; }

        .consultant-hero__kpis { display: flex; gap: 0; background: #F7F5F0; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
        .hero-kpi { display: flex; flex-direction: column; gap: 3px; align-items: center; padding: 16px 20px; border-right: 1px solid #E8E6E1; }
        .hero-kpi:last-child { border-right: none; }
        .hero-kpi__value { font-size: 1.375rem; font-weight: 700; color: #1A1A18; font-variant-numeric: tabular-nums; }
        .hero-kpi__label { font-size: 0.6875rem; color: #6B6B68; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; white-space: nowrap; }

        .consultant-detail__layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .consultant-detail__layout { grid-template-columns: 1fr; } }
        .consultant-detail__main { display: flex; flex-direction: column; gap: 16px; }

        .form-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; }
        .form-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; margin-bottom: 16px; }
        .form-skeleton { height: 280px; border-radius: 8px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .table-skeleton { height: 320px; border-radius: 12px; background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }

        .section-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; margin-bottom: 12px; }

        .sidebar-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .sidebar-card:last-child { margin-bottom: 0; }
        .sidebar-card__title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }

        .sidebar-big-stat { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-big-stat__value { font-size: 2.5rem; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
        .sidebar-big-stat__label { font-size: 0.8125rem; color: #6B6B68; }

        .sidebar-rating { display: flex; align-items: center; gap: 10px; }
        .sidebar-rating__value { font-size: 1.25rem; font-weight: 700; color: #1A1A18; }
        .sidebar-rating__stars { display: flex; gap: 2px; }

        .sidebar-info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5F3EF; }
        .sidebar-info-row:last-child { border-bottom: none; }
        .sidebar-info-key { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-info-val { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; max-width: 160px; overflow: hidden; text-overflow: ellipsis; text-align: right; }

        .sidebar-actions { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-action-link { display: flex; align-items: center; padding: 9px 10px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: #1A1A18; text-decoration: none; transition: background 0.15s; }
        .sidebar-action-link:hover { background: #F5F3EF; }

        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}