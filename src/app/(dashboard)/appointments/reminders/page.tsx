'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

const APPT_SUBNAV = [
  { href: '/appointments', label: 'All Appointments' },
  { href: '/appointments/availability', label: 'Availability' },
  { href: '/appointments/consultants', label: 'Consultants' },
  { href: '/appointments/reminders', label: 'Reminders' },
]

type Reminder = {
  id: string
  name: string
  trigger: string
  channel: ('email' | 'sms')[]
  types: ('home' | 'online' | 'showroom')[]
  status: 'active' | 'paused'
  sentThisMonth: number
  openRate: number | null
  lastSent: string
}

const REMINDERS: Reminder[] = [
  {
    id: 'confirm-24h',
    name: 'Booking Confirmation',
    trigger: 'Immediately on booking',
    channel: ['email', 'sms'],
    types: ['home', 'online', 'showroom'],
    status: 'active',
    sentThisMonth: 342,
    openRate: 94.2,
    lastSent: '2 hours ago',
  },
  {
    id: 'reminder-48h',
    name: '48 Hour Reminder',
    trigger: '48 hours before appointment',
    channel: ['email'],
    types: ['home', 'online', 'showroom'],
    status: 'active',
    sentThisMonth: 286,
    openRate: 78.4,
    lastSent: 'Yesterday',
  },
  {
    id: 'reminder-2h',
    name: '2 Hour Reminder',
    trigger: '2 hours before appointment',
    channel: ['sms'],
    types: ['home', 'showroom'],
    status: 'active',
    sentThisMonth: 198,
    openRate: null,
    lastSent: 'Today',
  },
  {
    id: 'followup-24h',
    name: 'Post-Appointment Follow-up',
    trigger: '24 hours after appointment',
    channel: ['email'],
    types: ['home', 'online', 'showroom'],
    status: 'active',
    sentThisMonth: 214,
    openRate: 61.3,
    lastSent: 'Yesterday',
  },
  {
    id: 'no-show',
    name: 'No-Show Re-book',
    trigger: '1 hour after missed appointment',
    channel: ['email', 'sms'],
    types: ['home', 'online', 'showroom'],
    status: 'paused',
    sentThisMonth: 0,
    openRate: null,
    lastSent: '3 weeks ago',
  },
  {
    id: 'cancel-confirm',
    name: 'Cancellation Confirmation',
    trigger: 'On cancellation',
    channel: ['email'],
    types: ['home', 'online', 'showroom'],
    status: 'active',
    sentThisMonth: 18,
    openRate: 88.0,
    lastSent: '4 days ago',
  },
]

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  home:     { color: '#8B6914', bg: '#FFF8E6', label: 'Home' },
  online:   { color: '#2980B9', bg: '#EBF4FB', label: 'Online' },
  showroom: { color: '#27AE60', bg: '#EAF7EF', label: 'Showroom' },
}

export default function RemindersListPage() {
  const [reminders, setReminders] = useState(REMINDERS)

  function toggleStatus(id: string) {
    setReminders(r => r.map(rem => rem.id === id
      ? { ...rem, status: rem.status === 'active' ? 'paused' : 'active' }
      : rem
    ))
  }

  const active = reminders.filter(r => r.status === 'active').length
  const totalSent = reminders.reduce((a, r) => a + r.sentThisMonth, 0)

  return (
    <div className="reminders-page">
      <div className="reminders-page__topbar">
        <PageHeader
          title="Appointments"
          description="Manage home measurements, online consultations, and showroom visits."
        />
        <Link href="/appointments/reminders/new" className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Reminder
        </Link>
      </div>

      <nav className="subnav">
        {APPT_SUBNAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={`subnav__item${item.href === '/appointments/reminders' ? ' subnav__item--active' : ''}`}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="reminders-page__stats">
        {[
          { label: 'Total Reminders', value: reminders.length.toString() },
          { label: 'Active', value: active.toString(), color: '#27AE60' },
          { label: 'Sent This Month', value: totalSent.toLocaleString() },
          { label: 'Avg Open Rate', value: `${(reminders.filter(r => r.openRate).reduce((a, r) => a + (r.openRate ?? 0), 0) / reminders.filter(r => r.openRate).length).toFixed(1)}%` },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-tile">
            <span className="stat-tile__label">{label}</span>
            <span className="stat-tile__value" style={color ? { color } : {}}>{value}</span>
          </div>
        ))}
      </div>

      <div className="reminders-list">
        {reminders.map((r) => (
          <div key={r.id} className={`reminder-row${r.status === 'paused' ? ' reminder-row--paused' : ''}`}>
            <div className="reminder-row__left">
              <div className="reminder-row__title-group">
                <Link href={`/appointments/reminders/${r.id}`} className="reminder-row__name">
                  {r.name}
                </Link>
                <span className="reminder-row__trigger">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {r.trigger}
                </span>
              </div>

              <div className="reminder-row__chips">
                {r.channel.map(ch => (
                  <span key={ch} className={`channel-chip channel-chip--${ch}`}>
                    {ch === 'email' ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    )}
                    {ch === 'email' ? 'Email' : 'SMS'}
                  </span>
                ))}
                {r.types.map(t => (
                  <span key={t} className="type-chip" style={{ color: TYPE_CONFIG[t].color, background: TYPE_CONFIG[t].bg }}>
                    {TYPE_CONFIG[t].label}
                  </span>
                ))}
              </div>
            </div>

            <div className="reminder-row__metrics">
              <div className="reminder-metric">
                <span className="reminder-metric__val">{r.sentThisMonth.toLocaleString()}</span>
                <span className="reminder-metric__label">sent</span>
              </div>
              {r.openRate !== null && (
                <div className="reminder-metric">
                  <span className="reminder-metric__val">{r.openRate}%</span>
                  <span className="reminder-metric__label">open rate</span>
                </div>
              )}
              <div className="reminder-metric reminder-metric--muted">
                <span className="reminder-metric__val">{r.lastSent}</span>
                <span className="reminder-metric__label">last sent</span>
              </div>
            </div>

            <div className="reminder-row__right">
              <button
                className={`toggle-btn${r.status === 'active' ? ' toggle-btn--on' : ''}`}
                onClick={() => toggleStatus(r.id)}
                title={r.status === 'active' ? 'Pause reminder' : 'Activate reminder'}
                aria-label={`${r.status === 'active' ? 'Pause' : 'Activate'} ${r.name}`}
              >
                <span className="toggle-btn__track">
                  <span className="toggle-btn__thumb" />
                </span>
                <span className="toggle-btn__label">{r.status === 'active' ? 'Active' : 'Paused'}</span>
              </button>
              <Link href={`/appointments/reminders/${r.id}`} className="edit-btn" title="Edit reminder">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .reminders-page { display: flex; flex-direction: column; gap: 24px; }
        .reminders-page__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: background 0.15s; white-space: nowrap; flex-shrink: 0; margin-top: 4px; }
        .btn-primary:hover { background: #2E2E2A; }

        .subnav { display: flex; gap: 2px; border-bottom: 1.5px solid #E8E6E1; overflow-x: auto; }
        .subnav__item { height: 38px; padding: 0 14px; display: flex; align-items: center; font-size: 0.875rem; font-weight: 500; color: #6B6B68; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; white-space: nowrap; transition: color 0.15s; }
        .subnav__item:hover { color: #1A1A18; }
        .subnav__item--active { color: #1A1A18; font-weight: 600; border-bottom-color: #1A1A18; }

        .reminders-page__stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 900px) { .reminders-page__stats { grid-template-columns: repeat(2, 1fr); } }
        .stat-tile { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 12px; padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; }
        .stat-tile__label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }
        .stat-tile__value { font-size: 1.75rem; font-weight: 700; color: #1A1A18; font-variant-numeric: tabular-nums; }

        .reminders-list { display: flex; flex-direction: column; gap: 0; background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; overflow: hidden; }

        .reminder-row { display: flex; align-items: center; gap: 20px; padding: 18px 20px; border-bottom: 1px solid #F0EDE8; transition: background 0.1s; flex-wrap: wrap; }
        .reminder-row:last-child { border-bottom: none; }
        .reminder-row:hover { background: #FAFAF8; }
        .reminder-row--paused { opacity: 0.65; }

        .reminder-row__left { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 200px; }
        .reminder-row__title-group { display: flex; flex-direction: column; gap: 3px; }

        .reminder-row__name { font-size: 0.9375rem; font-weight: 600; color: #1A1A18; text-decoration: none; transition: color 0.15s; }
        .reminder-row__name:hover { color: #8B6914; }

        .reminder-row__trigger { display: flex; align-items: center; gap: 5px; font-size: 0.8125rem; color: #6B6B68; }

        .reminder-row__chips { display: flex; gap: 6px; flex-wrap: wrap; }

        .channel-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 0.6875rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
        .channel-chip--email { color: #2980B9; background: #EBF4FB; }
        .channel-chip--sms   { color: #27AE60; background: #EAF7EF; }

        .type-chip { font-size: 0.6875rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; }

        .reminder-row__metrics { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
        .reminder-metric { display: flex; flex-direction: column; gap: 1px; align-items: flex-end; }
        .reminder-metric__val { font-size: 0.9375rem; font-weight: 700; color: #1A1A18; font-variant-numeric: tabular-nums; }
        .reminder-metric__label { font-size: 0.6875rem; color: #B8B5AE; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .reminder-metric--muted .reminder-metric__val { font-size: 0.8125rem; font-weight: 500; color: #6B6B68; }

        .reminder-row__right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        .toggle-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; }
        .toggle-btn__track { width: 40px; height: 22px; background: #D8D5CE; border-radius: 22px; display: flex; align-items: center; padding: 2px; transition: background 0.2s; flex-shrink: 0; }
        .toggle-btn--on .toggle-btn__track { background: #1A1A18; }
        .toggle-btn__thumb { width: 18px; height: 18px; background: #FFFFFF; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .toggle-btn--on .toggle-btn__thumb { transform: translateX(18px); }
        .toggle-btn__label { font-size: 0.8125rem; font-weight: 500; color: #6B6B68; white-space: nowrap; }
        .toggle-btn--on .toggle-btn__label { color: #1A1A18; }

        .edit-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #E8E6E1; background: #FFFFFF; color: #6B6B68; text-decoration: none; transition: border-color 0.15s, color 0.15s; }
        .edit-btn:hover { border-color: #1A1A18; color: #1A1A18; }
      `}</style>
    </div>
  )
}