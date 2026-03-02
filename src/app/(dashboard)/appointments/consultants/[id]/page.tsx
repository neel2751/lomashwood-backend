'use client'

import { useState } from 'react'

const ALL_SHOWROOMS = ['London Mayfair', 'Manchester', 'Birmingham']
const ALL_ROLES     = ['Junior Consultant', 'Design Consultant', 'Senior Consultant']

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  home:     { label: 'Home Measurement', color: '#8B6914', bg: '#FFF8E6' },
  online:   { label: 'Online',           color: '#2980B9', bg: '#EBF4FB' },
  showroom: { label: 'Showroom',         color: '#27AE60', bg: '#EAF7EF' },
}

export type ConsultantFormProps = {
  consultantId: string
  defaultValues: {
    name:      string
    email:     string
    phone:     string
    role:      string
    showrooms: string[]
    types:     string[]
    bio:       string
  }
}

export function ConsultantForm({ consultantId: _consultantId, defaultValues }: ConsultantFormProps) {
  const [values, setValues] = useState(defaultValues)
  const [saved, setSaved]   = useState(false)

  function setField<K extends keyof typeof values>(key: K, val: typeof values[K]) {
    setValues(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function toggleArray(key: 'showrooms' | 'types', item: string) {
    setValues(prev => {
      const arr = prev[key] as string[]
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item],
      }
    })
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    setSaved(true)
  }

  return (
    <form className="cf" onSubmit={handleSave}>
      <div className="cf__grid">
        <div className="cf__field">
          <label className="cf__label" htmlFor="cf-name">Full Name</label>
          <input
            id="cf-name"
            className="cf__input"
            type="text"
            value={values.name}
            onChange={e => setField('name', e.target.value)}
            required
          />
        </div>

        <div className="cf__field">
          <label className="cf__label" htmlFor="cf-role">Role</label>
          <select
            id="cf-role"
            className="cf__input cf__select"
            value={values.role}
            onChange={e => setField('role', e.target.value)}
          >
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="cf__field">
          <label className="cf__label" htmlFor="cf-email">Email</label>
          <input
            id="cf-email"
            className="cf__input"
            type="email"
            value={values.email}
            onChange={e => setField('email', e.target.value)}
            required
          />
        </div>

        <div className="cf__field">
          <label className="cf__label" htmlFor="cf-phone">Phone</label>
          <input
            id="cf-phone"
            className="cf__input"
            type="tel"
            value={values.phone}
            onChange={e => setField('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="cf__field cf__field--full">
        <label className="cf__label" htmlFor="cf-bio">Bio</label>
        <textarea
          id="cf-bio"
          className="cf__input cf__textarea"
          value={values.bio}
          rows={3}
          onChange={e => setField('bio', e.target.value)}
        />
      </div>

      <div className="cf__field cf__field--full">
        <span className="cf__label">Showrooms</span>
        <div className="cf__toggle-group">
          {ALL_SHOWROOMS.map(s => (
            <button
              key={s}
              type="button"
              className={`cf__toggle${values.showrooms.includes(s) ? ' cf__toggle--on' : ''}`}
              onClick={() => toggleArray('showrooms', s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="cf__field cf__field--full">
        <span className="cf__label">Appointment Types</span>
        <div className="cf__toggle-group">
          {Object.entries(TYPE_CONFIG).map(([key, conf]) => {
            const on = values.types.includes(key)
            return (
              <button
                key={key}
                type="button"
                className="cf__toggle cf__toggle--typed"
                style={on ? { background: conf.bg, color: conf.color, borderColor: conf.color } : undefined}
                onClick={() => toggleArray('types', key)}
              >
                {conf.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="cf__footer">
        {saved && <span className="cf__saved">✓ Changes saved</span>}
        <button type="submit" className="cf__submit">Save Changes</button>
      </div>

      <style>{`
        .cf { display: flex; flex-direction: column; gap: 16px; }

        .cf__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 600px) { .cf__grid { grid-template-columns: 1fr; } }

        .cf__field { display: flex; flex-direction: column; gap: 6px; }
        .cf__field--full { grid-column: 1 / -1; }

        .cf__label { font-size: 0.8125rem; font-weight: 600; color: #6B6B68; }

        .cf__input {
          height: 40px; padding: 0 12px;
          border: 1.5px solid #E8E6E1; border-radius: 8px;
          background: #FAFAF8; color: #1A1A18;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem;
          outline: none; transition: border-color 0.15s;
          width: 100%; box-sizing: border-box;
        }
        .cf__input:focus { border-color: #8B6914; background: #FFFFFF; }
        .cf__select { cursor: pointer; }
        .cf__textarea { height: auto; padding: 10px 12px; resize: vertical; }

        .cf__toggle-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .cf__toggle {
          height: 34px; padding: 0 14px;
          border: 1.5px solid #E8E6E1; border-radius: 8px;
          background: #FAFAF8; color: #6B6B68;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.8125rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .cf__toggle--on { background: #1A1A18; color: #F5F0E8; border-color: #1A1A18; }
        .cf__toggle--typed { }
        .cf__toggle:hover:not(.cf__toggle--on) { border-color: #B8B5AE; }

        .cf__footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding-top: 4px; }
        .cf__saved { font-size: 0.875rem; color: #27AE60; font-weight: 500; }
        .cf__submit {
          height: 38px; padding: 0 20px;
          background: #1A1A18; color: #F5F0E8;
          border: none; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .cf__submit:hover { background: #2E2E2A; }
      `}</style>
    </form>
  )
}