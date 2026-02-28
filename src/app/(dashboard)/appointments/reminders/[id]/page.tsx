'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

type Props = { params: { id: string } }

const REMINDERS: Record<string, {
  name: string
  trigger: string
  triggerOffset: number
  triggerUnit: 'minutes' | 'hours' | 'days'
  triggerDirection: 'before' | 'after' | 'on'
  channel: ('email' | 'sms')[]
  types: ('home' | 'online' | 'showroom')[]
  status: 'active' | 'paused'
  emailSubject: string
  emailBody: string
  smsBody: string
  sentThisMonth: number
  openRate: number | null
  lastSent: string
}> = {
  'confirm-24h': {
    name: 'Booking Confirmation', trigger: 'Immediately on booking', triggerOffset: 0, triggerUnit: 'minutes', triggerDirection: 'on',
    channel: ['email', 'sms'], types: ['home', 'online', 'showroom'], status: 'active',
    emailSubject: 'Your Lomash Wood appointment is confirmed ✓',
    emailBody: "Hi {{customer_name}},\n\nThank you for booking with Lomash Wood. Your {{appointment_type}} appointment has been confirmed for {{date}} at {{time}}.\n\nYour consultant: {{consultant_name}}\n\nIf you need to reschedule, please contact us at least 24 hours in advance.\n\nWarm regards,\nThe Lomash Wood Team",
    smsBody: "Lomash Wood: Your appointment is confirmed for {{date}} at {{time}} with {{consultant_name}}. To reschedule, call 0800 123 456.",
    sentThisMonth: 342, openRate: 94.2, lastSent: '2 hours ago',
  },
  'reminder-48h': {
    name: '48 Hour Reminder', trigger: '48 hours before appointment', triggerOffset: 48, triggerUnit: 'hours', triggerDirection: 'before',
    channel: ['email'], types: ['home', 'online', 'showroom'], status: 'active',
    emailSubject: 'Your Lomash Wood appointment is in 2 days',
    emailBody: "Hi {{customer_name}},\n\nThis is a friendly reminder that your {{appointment_type}} appointment is coming up in 2 days.\n\nDate: {{date}}\nTime: {{time}}\nConsultant: {{consultant_name}}\n\nPlease let us know if you need to make any changes.\n\nWarm regards,\nThe Lomash Wood Team",
    smsBody: '',
    sentThisMonth: 286, openRate: 78.4, lastSent: 'Yesterday',
  },
  'reminder-2h': {
    name: '2 Hour Reminder', trigger: '2 hours before appointment', triggerOffset: 2, triggerUnit: 'hours', triggerDirection: 'before',
    channel: ['sms'], types: ['home', 'showroom'], status: 'active',
    emailSubject: '',
    emailBody: '',
    smsBody: "Lomash Wood reminder: Your appointment with {{consultant_name}} is in 2 hours ({{time}} today). Reply STOP to opt out.",
    sentThisMonth: 198, openRate: null, lastSent: 'Today',
  },
  'followup-24h': {
    name: 'Post-Appointment Follow-up', trigger: '24 hours after appointment', triggerOffset: 24, triggerUnit: 'hours', triggerDirection: 'after',
    channel: ['email'], types: ['home', 'online', 'showroom'], status: 'active',
    emailSubject: 'How was your Lomash Wood consultation?',
    emailBody: "Hi {{customer_name}},\n\nThank you for meeting with us yesterday. We hope your {{appointment_type}} consultation was helpful.\n\nWe'd love to hear your feedback. You can view your personalised design quote at: {{quote_link}}\n\nIf you have any questions, our team is here to help.\n\nWarm regards,\nThe Lomash Wood Team",
    smsBody: '',
    sentThisMonth: 214, openRate: 61.3, lastSent: 'Yesterday',
  },
  'no-show': {
    name: 'No-Show Re-book', trigger: '1 hour after missed appointment', triggerOffset: 1, triggerUnit: 'hours', triggerDirection: 'after',
    channel: ['email', 'sms'], types: ['home', 'online', 'showroom'], status: 'paused',
    emailSubject: 'We missed you — let\'s rearrange your Lomash Wood appointment',
    emailBody: "Hi {{customer_name}},\n\nIt looks like we missed each other for your {{appointment_type}} appointment today. No problem — we'd love to find a time that works better for you.\n\nBook a new time here: {{booking_link}}\n\nWarm regards,\nThe Lomash Wood Team",
    smsBody: "Lomash Wood: Missed your appointment today? Rebook at {{booking_link}} or call 0800 123 456.",
    sentThisMonth: 0, openRate: null, lastSent: '3 weeks ago',
  },
  'cancel-confirm': {
    name: 'Cancellation Confirmation', trigger: 'On cancellation', triggerOffset: 0, triggerUnit: 'minutes', triggerDirection: 'on',
    channel: ['email'], types: ['home', 'online', 'showroom'], status: 'active',
    emailSubject: 'Your Lomash Wood appointment has been cancelled',
    emailBody: "Hi {{customer_name}},\n\nYour {{appointment_type}} appointment on {{date}} has been successfully cancelled.\n\nWhenever you're ready, we'd love to help you design your perfect kitchen or bedroom. You can book a new appointment at: {{booking_link}}\n\nWarm regards,\nThe Lomash Wood Team",
    smsBody: '',
    sentThisMonth: 18, openRate: 88.0, lastSent: '4 days ago',
  },
}

const TEMPLATE_VARS = ['{{customer_name}}', '{{appointment_type}}', '{{date}}', '{{time}}', '{{consultant_name}}', '{{booking_link}}', '{{quote_link}}']

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  home:     { color: '#8B6914', bg: '#FFF8E6', label: 'Home' },
  online:   { color: '#2980B9', bg: '#EBF4FB', label: 'Online' },
  showroom: { color: '#27AE60', bg: '#EAF7EF', label: 'Showroom' },
}

export default function ReminderDetailPage({ params }: Props) {
  const reminder = REMINDERS[params.id]
  if (!reminder) notFound()

  const [activeChannel, setActiveChannel] = useState<'email' | 'sms'>(
    reminder.channel.includes('email') ? 'email' : 'sms'
  )
  const [emailSubject, setEmailSubject] = useState(reminder.emailSubject)
  const [emailBody, setEmailBody] = useState(reminder.emailBody)
  const [smsBody, setSmsBody] = useState(reminder.smsBody)
  const [saved, setSaved] = useState(false)

  function insertVar(v: string) {
    if (activeChannel === 'email') {
      setEmailBody(b => b + v)
    } else {
      setSmsBody(b => b + v)
    }
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="reminder-detail">
      <div className="reminder-detail__topbar">
        <PageHeader
          title={reminder.name}
          description={reminder.trigger}
          backHref="/appointments/reminders"
          backLabel="Reminders"
        />
        <div className="reminder-detail__actions">
          <button className="btn-danger-ghost">Delete</button>
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
      </div>

      <div className="reminder-detail__layout">
        <div className="reminder-detail__main">
          <div className="form-card">
            <h2 className="form-card__title">Trigger</h2>
            <div className="trigger-row">
              <select className="trigger-select" defaultValue={reminder.triggerDirection}>
                <option value="on">Immediately on</option>
                <option value="before">Before appointment</option>
                <option value="after">After appointment</option>
              </select>
              {reminder.triggerDirection !== 'on' && (
                <>
                  <input type="number" min={1} defaultValue={reminder.triggerOffset} className="trigger-number" />
                  <select className="trigger-select" defaultValue={reminder.triggerUnit}>
                    <option value="minutes">minutes</option>
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                  </select>
                </>
              )}
            </div>

            <div className="field">
              <label>Appointment Types</label>
              <div className="type-checkboxes">
                {(['home', 'online', 'showroom'] as const).map(t => (
                  <label key={t} className={`type-check${reminder.types.includes(t) ? ' type-check--checked' : ''}`}>
                    <input type="checkbox" defaultChecked={reminder.types.includes(t)} />
                    <span style={{ color: TYPE_CONFIG[t].color }}>{TYPE_CONFIG[t].label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Channels</label>
              <div className="channel-checkboxes">
                {(['email', 'sms'] as const).map(ch => (
                  <label key={ch} className={`channel-check${reminder.channel.includes(ch) ? ' channel-check--checked' : ''}`}>
                    <input type="checkbox" defaultChecked={reminder.channel.includes(ch)} />
                    {ch === 'email' ? 'Email' : 'SMS'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2 className="form-card__title">Message Template</h2>

            {reminder.channel.length > 1 && (
              <div className="channel-tabs">
                {reminder.channel.map(ch => (
                  <button
                    key={ch}
                    className={`channel-tab${activeChannel === ch ? ' channel-tab--active' : ''}`}
                    onClick={() => setActiveChannel(ch)}
                  >
                    {ch === 'email' ? '✉ Email' : '📱 SMS'}
                  </button>
                ))}
              </div>
            )}

            {activeChannel === 'email' && (
              <div className="template-editor">
                <div className="field">
                  <label>Subject line</label>
                  <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                </div>
                <div className="field">
                  <label>Body</label>
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10} className="template-textarea" />
                </div>
              </div>
            )}

            {activeChannel === 'sms' && (
              <div className="template-editor">
                <div className="field">
                  <label>SMS body <span className="char-count">({smsBody.length}/160)</span></label>
                  <textarea value={smsBody} onChange={e => setSmsBody(e.target.value)} rows={5} maxLength={160} className="template-textarea" />
                </div>
              </div>
            )}

            <div className="template-vars">
              <span className="template-vars__label">Insert variable:</span>
              <div className="template-vars__chips">
                {TEMPLATE_VARS.map(v => (
                  <button key={v} className="var-chip" onClick={() => insertVar(v)} type="button">
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="reminder-detail__sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Performance</h3>
            <div className="sidebar-metric">
              <span className="sidebar-metric__val">{reminder.sentThisMonth.toLocaleString()}</span>
              <span className="sidebar-metric__label">sent this month</span>
            </div>
            {reminder.openRate !== null && (
              <div className="sidebar-metric">
                <span className="sidebar-metric__val sidebar-metric__val--gold">{reminder.openRate}%</span>
                <span className="sidebar-metric__label">email open rate</span>
              </div>
            )}
            <div className="sidebar-info-row">
              <span className="sidebar-info-key">Last sent</span>
              <span className="sidebar-info-val">{reminder.lastSent}</span>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Status</h3>
            <div className="sidebar-status">
              <div className={`status-dot${reminder.status === 'active' ? ' status-dot--active' : ''}`} />
              <span className="sidebar-status__label">
                {reminder.status === 'active' ? 'Active — sending' : 'Paused — not sending'}
              </span>
            </div>
            <button className={`sidebar-status-btn${reminder.status === 'active' ? ' sidebar-status-btn--pause' : ' sidebar-status-btn--activate'}`}>
              {reminder.status === 'active' ? 'Pause Reminder' : 'Activate Reminder'}
            </button>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card__title">Template Variables</h3>
            <p className="sidebar-vars-help">Click any variable in the editor to copy it to the message template.</p>
            <div className="sidebar-var-list">
              {TEMPLATE_VARS.map(v => (
                <code key={v} className="sidebar-var">{v}</code>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .reminder-detail { display: flex; flex-direction: column; gap: 24px; }
        .reminder-detail__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .reminder-detail__actions { display: flex; gap: 10px; padding-top: 4px; }

        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #2E2E2A; }
        .btn-danger-ghost { display: inline-flex; align-items: center; height: 38px; padding: 0 14px; background: none; border: 1.5px solid #F5C6C6; border-radius: 8px; color: #C0392B; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-danger-ghost:hover { background: #FDF2F2; }

        .reminder-detail__layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .reminder-detail__layout { grid-template-columns: 1fr; } }
        .reminder-detail__main { display: flex; flex-direction: column; gap: 16px; }

        .form-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 18px; }
        .form-card__title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.0625rem; font-weight: 700; color: #1A1A18; }

        .trigger-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .trigger-select { height: 40px; padding: 0 32px 0 12px; border: 1.5px solid #E8E6E1; border-radius: 10px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; color: #1A1A18; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; transition: border-color 0.15s; }
        .trigger-select:focus { border-color: #8B6914; }
        .trigger-number { height: 40px; width: 72px; padding: 0 12px; border: 1.5px solid #E8E6E1; border-radius: 10px; font-family: 'DM Mono', monospace; font-size: 1rem; color: #1A1A18; outline: none; text-align: center; -moz-appearance: textfield; }
        .trigger-number::-webkit-outer-spin-button, .trigger-number::-webkit-inner-spin-button { -webkit-appearance: none; }
        .trigger-number:focus { border-color: #8B6914; }

        .field { display: flex; flex-direction: column; gap: 8px; }
        .field label { font-size: 0.875rem; font-weight: 500; color: #1A1A18; }

        .type-checkboxes, .channel-checkboxes { display: flex; gap: 8px; flex-wrap: wrap; }
        .type-check, .channel-check { display: flex; align-items: center; gap: 7px; padding: 8px 14px; border: 1.5px solid #E8E6E1; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #1A1A18; transition: border-color 0.15s; }
        .type-check input, .channel-check input { display: none; }
        .type-check--checked, .channel-check--checked { border-color: #8B6914; background: #FFFDF7; }

        .channel-tabs { display: flex; gap: 4px; background: #F0EDE8; border-radius: 10px; padding: 3px; width: fit-content; }
        .channel-tab { height: 32px; padding: 0 14px; border: none; border-radius: 8px; background: none; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.8125rem; font-weight: 500; color: #6B6B68; cursor: pointer; transition: background 0.15s, color 0.15s; }
        .channel-tab--active { background: #FFFFFF; color: #1A1A18; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

        .template-editor { display: flex; flex-direction: column; gap: 14px; }

        input[type="text"] { width: 100%; height: 42px; padding: 0 14px; border: 1.5px solid #E8E6E1; border-radius: 10px; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.9375rem; color: #1A1A18; outline: none; transition: border-color 0.15s; }
        input[type="text"]:focus { border-color: #8B6914; box-shadow: 0 0 0 3px rgba(139,105,20,0.1); }

        .template-textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #E8E6E1; border-radius: 10px; background: #FFFFFF; font-family: 'DM Mono', monospace; font-size: 0.8125rem; color: #1A1A18; outline: none; resize: vertical; line-height: 1.6; transition: border-color 0.15s; }
        .template-textarea:focus { border-color: #8B6914; box-shadow: 0 0 0 3px rgba(139,105,20,0.1); }

        .char-count { font-size: 0.75rem; color: #B8B5AE; font-weight: 400; }

        .template-vars { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: #F7F5F0; border-radius: 10px; }
        .template-vars__label { font-size: 0.8125rem; font-weight: 500; color: #6B6B68; }
        .template-vars__chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .var-chip { background: #FFFFFF; border: 1px solid #E8E6E1; border-radius: 6px; padding: 3px 9px; font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #8B6914; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .var-chip:hover { border-color: #8B6914; background: #FFF8E6; }

        .sidebar-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .sidebar-card:last-child { margin-bottom: 0; }
        .sidebar-card__title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6B68; }

        .sidebar-metric { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-metric__val { font-size: 1.75rem; font-weight: 700; color: #1A1A18; font-variant-numeric: tabular-nums; line-height: 1.1; }
        .sidebar-metric__val--gold { color: #8B6914; }
        .sidebar-metric__label { font-size: 0.75rem; color: #6B6B68; }

        .sidebar-info-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
        .sidebar-info-key { font-size: 0.8125rem; color: #6B6B68; }
        .sidebar-info-val { font-size: 0.8125rem; font-weight: 500; color: #1A1A18; }

        .sidebar-status { display: flex; align-items: center; gap: 8px; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; background: #D8D5CE; flex-shrink: 0; }
        .status-dot--active { background: #27AE60; box-shadow: 0 0 0 3px rgba(39,174,96,0.2); }
        .sidebar-status__label { font-size: 0.8125rem; color: #1A1A18; font-weight: 500; }

        .sidebar-status-btn { width: 100%; height: 36px; border-radius: 8px; border: 1.5px solid #E8E6E1; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .sidebar-status-btn--pause { color: #D4820A; border-color: #F5DEB5; }
        .sidebar-status-btn--pause:hover { background: #FFF3DC; }
        .sidebar-status-btn--activate { color: #27AE60; border-color: #C3E8CC; }
        .sidebar-status-btn--activate:hover { background: #EAF7EF; }

        .sidebar-vars-help { font-size: 0.8125rem; color: #6B6B68; line-height: 1.5; }
        .sidebar-var-list { display: flex; flex-direction: column; gap: 4px; }
        .sidebar-var { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #8B6914; background: #FFF8E6; padding: 3px 8px; border-radius: 5px; }
      `}</style>
    </div>
  )
}