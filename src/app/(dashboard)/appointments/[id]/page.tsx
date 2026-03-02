

type TimelineEvent = {
  id: string
  type: 'created' | 'confirmed' | 'reminder' | 'rescheduled' | 'cancelled' | 'completed' | 'note'
  label: string
  description?: string
  timestamp: string
  actor?: string
}

const MOCK_TIMELINE: Record<string, TimelineEvent[]> = {
  'appt-001': [
    { id: 'e1', type: 'created',   label: 'Appointment booked',    description: 'Booked via website enquiry form.',       timestamp: '20 Feb 2026, 9:14 AM',  actor: 'Eleanor Whitfield' },
    { id: 'e2', type: 'confirmed', label: 'Appointment confirmed',  description: 'Confirmed by consultant.',               timestamp: '20 Feb 2026, 11:02 AM', actor: 'James Thornton' },
    { id: 'e3', type: 'reminder',  label: 'Reminder sent',          description: '48-hour reminder email dispatched.',     timestamp: '26 Feb 2026, 9:00 AM',  actor: 'System' },
  ],
  'appt-002': [
    { id: 'e1', type: 'created',   label: 'Appointment booked',    description: 'Booked via phone call.',                 timestamp: '22 Feb 2026, 2:45 PM',  actor: 'Marcus Chen' },
  ],
  'appt-003': [
    { id: 'e1', type: 'created',   label: 'Appointment booked',    description: 'Booked via showroom walk-in.',           timestamp: '24 Feb 2026, 10:30 AM', actor: 'Priya Sharma' },
    { id: 'e2', type: 'confirmed', label: 'Appointment confirmed',  description: 'Confirmed and showroom slot reserved.',  timestamp: '24 Feb 2026, 10:35 AM', actor: 'David Walsh' },
    { id: 'e3', type: 'note',      label: 'Note added',             description: 'Interested in handle-less range.',       timestamp: '24 Feb 2026, 10:40 AM', actor: 'David Walsh' },
  ],
}

const TYPE_STYLE: Record<TimelineEvent['type'], { color: string; bg: string; icon: string }> = {
  created:     { color: '#2980B9', bg: '#EBF4FB', icon: '📋' },
  confirmed:   { color: '#27AE60', bg: '#EAF7EF', icon: '✅' },
  reminder:    { color: '#8B6914', bg: '#FFF8E6', icon: '🔔' },
  rescheduled: { color: '#7D3C98', bg: '#F5EEF8', icon: '📅' },
  cancelled:   { color: '#C0392B', bg: '#FDF2F2', icon: '❌' },
  completed:   { color: '#6B6B68', bg: '#F0EDE8', icon: '🏁' },
  note:        { color: '#6B6B68', bg: '#F5F3EF', icon: '📝' },
}

type Props = {
  appointmentId: string
}

export function AppointmentTimeline({ appointmentId }: Props) {
  const events = MOCK_TIMELINE[appointmentId] ?? []

  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        No activity recorded yet.
      </div>
    )
  }

  return (
    <div className="timeline">
      {events.map((event, index) => {
        const style = TYPE_STYLE[event.type]
        const isLast = index === events.length - 1
        return (
          <div key={event.id} className="timeline-item">
            <div className="timeline-item__track">
              <div
                className="timeline-item__dot"
                style={{ background: style.bg, borderColor: style.color }}
                title={event.label}
              >
                <span className="timeline-item__dot-icon">{style.icon}</span>
              </div>
              {!isLast && <div className="timeline-item__line" />}
            </div>

            <div className="timeline-item__body">
              <div className="timeline-item__header">
                <span className="timeline-item__label">{event.label}</span>
                {event.actor && (
                  <span className="timeline-item__actor">{event.actor}</span>
                )}
              </div>
              {event.description && (
                <p className="timeline-item__desc">{event.description}</p>
              )}
              <span className="timeline-item__time">{event.timestamp}</span>
            </div>
          </div>
        )
      })}

      <style>{`
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-empty {
          font-size: 0.875rem;
          color: #6B6B68;
          padding: 16px 0;
        }

        .timeline-item {
          display: flex;
          gap: 14px;
          align-items: stretch;
        }

        .timeline-item__track {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          width: 34px;
        }

        .timeline-item__dot {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .timeline-item__dot-icon {
          font-size: 0.875rem;
          line-height: 1;
        }

        .timeline-item__line {
          width: 2px;
          flex: 1;
          background: #E8E6E1;
          margin: 4px 0;
          min-height: 16px;
        }

        .timeline-item__body {
          padding-bottom: 20px;
          flex: 1;
          padding-top: 6px;
        }

        .timeline-item:last-child .timeline-item__body {
          padding-bottom: 0;
        }

        .timeline-item__header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 3px;
        }

        .timeline-item__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .timeline-item__actor {
          font-size: 0.75rem;
          color: #6B6B68;
          background: #F5F3EF;
          padding: 1px 8px;
          border-radius: 20px;
        }

        .timeline-item__desc {
          font-size: 0.8125rem;
          color: #6B6B68;
          margin: 0 0 4px;
          line-height: 1.5;
        }

        .timeline-item__time {
          font-size: 0.75rem;
          color: #B8B5AE;
          font-family: 'DM Mono', monospace;
        }
      `}</style>
    </div>
  )
}