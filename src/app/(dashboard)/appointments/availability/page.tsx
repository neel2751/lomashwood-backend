'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { AvailabilityManager } from '@/components/appointments/AvailabilityManager'
import { TimeSlotEditor } from '@/components/appointments/TimeSlotEditor'

const APPT_SUBNAV = [
  { href: '/appointments', label: 'All Appointments' },
  { href: '/appointments/availability', label: 'Availability' },
  { href: '/appointments/consultants', label: 'Consultants' },
  { href: '/appointments/reminders', label: 'Reminders' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type DayConfig = { enabled: boolean; start: string; end: string; slotDuration: number }

const DEFAULT_SCHEDULE: Record<string, DayConfig> = {
  Monday:    { enabled: true,  start: '09:00', end: '17:00', slotDuration: 60 },
  Tuesday:   { enabled: true,  start: '09:00', end: '17:00', slotDuration: 60 },
  Wednesday: { enabled: true,  start: '09:00', end: '17:00', slotDuration: 60 },
  Thursday:  { enabled: true,  start: '09:00', end: '17:00', slotDuration: 60 },
  Friday:    { enabled: true,  start: '09:00', end: '16:00', slotDuration: 60 },
  Saturday:  { enabled: true,  start: '10:00', end: '16:00', slotDuration: 90 },
  Sunday:    { enabled: false, start: '10:00', end: '14:00', slotDuration: 90 },
}

const BLOCKED_DATES = ['2026-03-15', '2026-03-16', '2026-04-01']

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [activeTab, setActiveTab] = useState<'weekly' | 'blocked' | 'slots'>('weekly')
  const [saved, setSaved] = useState(false)

  function toggleDay(day: string) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }))
  }

  function updateTime(day: string, field: 'start' | 'end', val: string) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="avail-page">
      <div className="avail-page__topbar">
        <PageHeader
          title="Availability"
          description="Configure weekly schedules, blocked dates, and appointment slot durations."
          backHref="/appointments"
          backLabel="Appointments"
        />
        <button className="btn-primary" onClick={handleSave}>
          {saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Saved
            </>
          ) : 'Save Changes'}
        </button>
      </div>

      <nav className="subnav">
        {APPT_SUBNAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={`subnav__item${item.href === '/appointments/availability' ? ' subnav__item--active' : ''}`}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="avail-tabs">
        {[
          { key: 'weekly', label: 'Weekly Schedule' },
          { key: 'blocked', label: 'Blocked Dates' },
          { key: 'slots', label: 'Slot Configuration' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`avail-tab${activeTab === tab.key ? ' avail-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'weekly' && (
        <div className="avail-schedule-card">
          <div className="avail-schedule-header">
            <h2 className="card-title">Weekly Availability</h2>
            <p className="card-sub">Set default working hours for each day. Consultants can override these individually.</p>
          </div>
          <div className="avail-schedule-grid">
            {DAYS.map(day => {
              const cfg = schedule[day]
              return (
                <div key={day} className={`day-row${!cfg.enabled ? ' day-row--disabled' : ''}`}>
                  <div className="day-row__head">
                    <label className="day-toggle">
                      <input type="checkbox" checked={cfg.enabled} onChange={() => toggleDay(day)} />
                      <span className="day-toggle__track">
                        <span className="day-toggle__thumb" />
                      </span>
                    </label>
                    <span className="day-name">{day}</span>
                  </div>
                  <div className={`day-row__times${!cfg.enabled ? ' day-row__times--hidden' : ''}`}>
                    <input type="time" value={cfg.start} onChange={e => updateTime(day, 'start', e.target.value)} disabled={!cfg.enabled} className="time-input" />
                    <span className="time-sep">to</span>
                    <input type="time" value={cfg.end} onChange={e => updateTime(day, 'end', e.target.value)} disabled={!cfg.enabled} className="time-input" />
                    <select
                      value={cfg.slotDuration}
                      disabled={!cfg.enabled}
                      onChange={e => setSchedule(s => ({ ...s, [day]: { ...s[day], slotDuration: Number(e.target.value) } }))}
                      className="slot-select"
                    >
                      <option value={30}>30 min slots</option>
                      <option value={60}>60 min slots</option>
                      <option value={90}>90 min slots</option>
                      <option value={120}>2 hr slots</option>
                    </select>
                  </div>
                  {!cfg.enabled && <span className="day-row__closed">Closed</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'blocked' && (
        <div className="avail-blocked-card">
          <div className="avail-schedule-header">
            <h2 className="card-title">Blocked Dates</h2>
            <p className="card-sub">Dates when no appointments can be booked (holidays, training days, etc.).</p>
          </div>
          <div className="blocked-list">
            {BLOCKED_DATES.map(date => (
              <div key={date} className="blocked-date-row">
                <span className="blocked-date-row__date">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <button className="blocked-date-row__remove" title="Remove blocked date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
            <button className="add-blocked-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add blocked date
            </button>
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="avail-slots-card">
          <div className="avail-schedule-header">
            <h2 className="card-title">Slot Configuration</h2>
            <p className="card-sub">Configure appointment types and their durations and lead times.</p>
          </div>
          <div className="slot-config-grid">
            {[
              { type: 'Home Measurement', icon: '🏠', duration: '90 min', buffer: '30 min', maxPerDay: 4 },
              { type: 'Online',           icon: '💻', duration: '60 min', buffer: '15 min', maxPerDay: 8 },
              { type: 'Showroom',         icon: '🏪', duration: '60 min', buffer: '15 min', maxPerDay: 6 },
            ].map(slot => (
              <div key={slot.type} className="slot-config-card">
                <div className="slot-config-card__header">
                  <span className="slot-config-card__icon">{slot.icon}</span>
                  <span className="slot-config-card__type">{slot.type}</span>
                </div>
                <div className="slot-config-card__fields">
                  <div className="slot-field">
                    <label>Duration</label>
                    <select className="slot-select" defaultValue={slot.duration}>
                      <option>30 min</option>
                      <option>60 min</option>
                      <option>90 min</option>
                      <option>120 min</option>
                    </select>
                  </div>
                  <div className="slot-field">
                    <label>Buffer after</label>
                    <select className="slot-select" defaultValue={slot.buffer}>
                      <option>0 min</option>
                      <option>15 min</option>
                      <option>30 min</option>
                    </select>
                  </div>
                  <div className="slot-field">
                    <label>Max per day</label>
                    <input type="number" min={1} max={20} defaultValue={slot.maxPerDay} className="slot-number-input" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .avail-page { display: flex; flex-direction: column; gap: 24px; }
        .avail-page__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; margin-top: 4px; }
        .btn-primary:hover { background: #2E2E2A; }

        .subnav { display: flex; gap: 2px; border-bottom: 1.5px solid #E8E6E1; overflow-x: auto; }
        .subnav__item { height: 38px; padding: 0 14px; display: flex; align-items: center; font-size: 0.875rem; font-weight: 500; color: #6B6B68; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; white-space: nowrap; transition: color 0.15s; }
        .subnav__item:hover { color: #1A1A18; }
        .subnav__item--active { color: #1A1A18; font-weight: 600; border-bottom-color: #1A1A18; }

        .avail-tabs { display: flex; gap: 4px; background: #F0EDE8; border-radius: 10px; padding: 4px; width: fit-content; }
        .avail-tab { height: 34px; padding: 0 16px; border: none; border-radius: 7px; background: none; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; color: #6B6B68; cursor: pointer; transition: background 0.15s, color 0.15s; }
        .avail-tab:hover { color: #1A1A18; }
        .avail-tab--active { background: #FFFFFF; color: #1A1A18; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

        .avail-schedule-card, .avail-blocked-card, .avail-slots-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .avail-schedule-header { display: flex; flex-direction: column; gap: 4px; }
        .card-title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.125rem; font-weight: 700; color: #1A1A18; }
        .card-sub { font-size: 0.875rem; color: #6B6B68; }

        .avail-schedule-grid { display: flex; flex-direction: column; gap: 2px; }

        .day-row { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 10px; transition: background 0.1s; flex-wrap: wrap; }
        .day-row:hover { background: #FAFAF8; }
        .day-row--disabled { opacity: 0.6; }

        .day-row__head { display: flex; align-items: center; gap: 10px; min-width: 150px; }

        .day-toggle { position: relative; display: flex; align-items: center; cursor: pointer; }
        .day-toggle input { display: none; }
        .day-toggle__track { width: 36px; height: 20px; background: #D8D5CE; border-radius: 20px; display: flex; align-items: center; padding: 2px; transition: background 0.2s; }
        .day-toggle input:checked + .day-toggle__track { background: #1A1A18; }
        .day-toggle__thumb { width: 16px; height: 16px; background: #FFFFFF; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .day-toggle input:checked + .day-toggle__track .day-toggle__thumb { transform: translateX(16px); }

        .day-name { font-size: 0.9375rem; font-weight: 500; color: #1A1A18; width: 100px; }

        .day-row__times { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
        .day-row__times--hidden { visibility: hidden; }

        .time-input { height: 36px; padding: 0 10px; border: 1.5px solid #E8E6E1; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; outline: none; background: #FFFFFF; transition: border-color 0.15s; }
        .time-input:focus { border-color: #8B6914; }
        .time-input:disabled { opacity: 0.4; cursor: not-allowed; }
        .time-sep { font-size: 0.875rem; color: #6B6B68; }

        .slot-select { height: 36px; padding: 0 30px 0 10px; border: 1.5px solid #E8E6E1; border-radius: 8px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; transition: border-color 0.15s; }
        .slot-select:disabled { opacity: 0.4; cursor: not-allowed; }
        .slot-select:focus { border-color: #8B6914; }

        .day-row__closed { font-size: 0.8125rem; color: #B8B5AE; font-style: italic; }

        .blocked-list { display: flex; flex-direction: column; gap: 8px; }
        .blocked-date-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #FAFAF8; border: 1.5px solid #E8E6E1; border-radius: 10px; }
        .blocked-date-row__date { font-size: 0.9375rem; color: #1A1A18; font-weight: 500; }
        .blocked-date-row__remove { background: none; border: none; cursor: pointer; color: #B8B5AE; padding: 4px; border-radius: 4px; transition: color 0.15s, background 0.15s; display: flex; }
        .blocked-date-row__remove:hover { color: #C0392B; background: #FDF2F2; }

        .add-blocked-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: none; border: 1.5px dashed #D8D5CE; border-radius: 10px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; color: #6B6B68; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; align-self: flex-start; }
        .add-blocked-btn:hover { border-color: #8B6914; color: #8B6914; background: #FFFDF7; }

        .slot-config-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 900px) { .slot-config-grid { grid-template-columns: 1fr; } }

        .slot-config-card { background: #FAFAF8; border: 1.5px solid #E8E6E1; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 16px; }
        .slot-config-card__header { display: flex; align-items: center; gap: 10px; }
        .slot-config-card__icon { font-size: 1.25rem; }
        .slot-config-card__type { font-size: 0.9375rem; font-weight: 600; color: #1A1A18; }
        .slot-config-card__fields { display: flex; flex-direction: column; gap: 12px; }
        .slot-field { display: flex; flex-direction: column; gap: 5px; }
        .slot-field label { font-size: 0.8125rem; font-weight: 500; color: #6B6B68; }
        .slot-number-input { width: 80px; height: 36px; padding: 0 10px; border: 1.5px solid #E8E6E1; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; outline: none; -moz-appearance: textfield; }
        .slot-number-input::-webkit-outer-spin-button, .slot-number-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .slot-number-input:focus { border-color: #8B6914; }
      `}</style>
    </div>
  )
}