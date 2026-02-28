'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardBuilder } from '@/components/analytics/DashboardBuilder'

const WIDGET_TYPES = [
  {
    id: 'metric',
    label: 'Metric',
    description: 'Single KPI with delta',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  {
    id: 'line',
    label: 'Line Chart',
    description: 'Trends over time',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'bar',
    label: 'Bar Chart',
    description: 'Compare categories',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    id: 'funnel',
    label: 'Funnel',
    description: 'Conversion drop-off',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    ),
  },
  {
    id: 'table',
    label: 'Data Table',
    description: 'Rows and columns',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
      </svg>
    ),
  },
  {
    id: 'donut',
    label: 'Donut Chart',
    description: 'Proportional breakdown',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    ),
  },
]

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private — only you', icon: '🔒' },
  { value: 'team', label: 'Team — all admin users', icon: '👥' },
  { value: 'public', label: 'Public — anyone with the link', icon: '🌐' },
]

export default function NewDashboardPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('team')
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([])

  function toggleWidget(id: string) {
    setSelectedWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    )
  }

  return (
    <div className="new-dash-page">
      <PageHeader
        title="New Dashboard"
        description="Configure your dashboard and add widgets."
        backHref="/analytics/dashboards"
        backLabel="Dashboards"
      />

      <div className="new-dash-steps">
        {[
          { n: 1, label: 'Details' },
          { n: 2, label: 'Widgets' },
        ].map(({ n, label }) => (
          <div
            key={n}
            className={`step-pill${step === n ? ' step-pill--active' : ''}${step > n ? ' step-pill--done' : ''}`}
          >
            <span className="step-pill__num">
              {step > n ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : n}
            </span>
            <span className="step-pill__label">{label}</span>
          </div>
        ))}
        <div className="step-divider" />
      </div>

      {step === 1 && (
        <div className="new-dash-layout">
          <div className="new-dash-form-card">
            <h2 className="form-section-title">Dashboard details</h2>

            <div className="field">
              <label htmlFor="dash-name">Name <span className="required">*</span></label>
              <input
                id="dash-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Executive Summary"
                maxLength={80}
              />
              <span className="field-hint">{name.length}/80</span>
            </div>

            <div className="field">
              <label htmlFor="dash-desc">Description</label>
              <textarea
                id="dash-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this dashboard show? (optional)"
                rows={3}
                maxLength={200}
              />
              <span className="field-hint">{description.length}/200</span>
            </div>

            <div className="field">
              <label>Visibility</label>
              <div className="visibility-options">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`visibility-option${visibility === opt.value ? ' visibility-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={visibility === opt.value}
                      onChange={() => setVisibility(opt.value)}
                    />
                    <span className="visibility-option__icon">{opt.icon}</span>
                    <span className="visibility-option__label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <Link href="/analytics/dashboards" className="btn-ghost">Cancel</Link>
              <button
                className="btn-primary"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>

          <aside className="new-dash-tips">
            <div className="tips-card">
              <h3>Dashboard tips</h3>
              <ul>
                <li>Give your dashboard a clear, descriptive name so teammates can find it easily.</li>
                <li>Use "Team" visibility for operational dashboards and "Private" while you're still building.</li>
                <li>You can change name, description, and visibility later from the dashboard settings.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {step === 2 && (
        <div className="new-dash-widgets">
          <div className="new-dash-widgets__header">
            <div>
              <h2 className="form-section-title">Choose starting widgets</h2>
              <p className="form-section-sub">
                Pick the widget types to pre-populate your dashboard. You can add more later.
              </p>
            </div>
            <span className="selected-count">
              {selectedWidgets.length} selected
            </span>
          </div>

          <div className="widget-picker">
            {WIDGET_TYPES.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`widget-option${selectedWidgets.includes(w.id) ? ' widget-option--selected' : ''}`}
                onClick={() => toggleWidget(w.id)}
              >
                <span className="widget-option__icon">{w.icon}</span>
                <span className="widget-option__label">{w.label}</span>
                <span className="widget-option__desc">{w.description}</span>
                {selectedWidgets.includes(w.id) && (
                  <span className="widget-option__check" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setStep(1)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <button className="btn-primary">
              Create Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .new-dash-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .new-dash-steps {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .step-divider {
          flex: 1;
          height: 1.5px;
          background: #E8E6E1;
          order: -1;
          display: none;
        }

        .step-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          background: #F0EDE8;
          border: 1.5px solid #E8E6E1;
          transition: all 0.2s;
        }

        .step-pill--active {
          background: #1A1A18;
          border-color: #1A1A18;
        }

        .step-pill--done {
          background: #EAF7EF;
          border-color: #C3E8CC;
        }

        .step-pill__num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6B6B68;
          flex-shrink: 0;
        }

        .step-pill--active .step-pill__num {
          background: rgba(255,255,255,0.2);
          color: #F5F0E8;
        }

        .step-pill--done .step-pill__num {
          background: #27AE60;
          color: #fff;
        }

        .step-pill__label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #6B6B68;
        }

        .step-pill--active .step-pill__label {
          color: #F5F0E8;
        }

        .step-pill--done .step-pill__label {
          color: #27AE60;
        }

        .new-dash-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .new-dash-layout { grid-template-columns: 1fr; }
        }

        .new-dash-form-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .form-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1A1A18;
        }

        .form-section-sub {
          font-size: 0.875rem;
          color: #6B6B68;
          margin-top: 4px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .required {
          color: #C0392B;
        }

        .field-hint {
          font-size: 0.75rem;
          color: #B8B5AE;
          text-align: right;
          margin-top: -2px;
        }

        input[type="text"],
        textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.9375rem;
          color: #1A1A18;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          resize: vertical;
        }

        input:focus, textarea:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
        }

        input::placeholder, textarea::placeholder {
          color: #B8B5AE;
        }

        .visibility-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .visibility-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .visibility-option input[type="radio"] {
          display: none;
        }

        .visibility-option:hover {
          border-color: #C9A84C;
          background: #FFFDF7;
        }

        .visibility-option--active {
          border-color: #8B6914;
          background: #FFFDF7;
        }

        .visibility-option__icon {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .visibility-option__label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1A1A18;
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 4px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 40px;
          padding: 0 18px;
          background: #1A1A18;
          color: #F5F0E8;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2E2E2A;
        }

        .btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 40px;
          padding: 0 14px;
          background: none;
          border: none;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6B6B68;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s;
        }

        .btn-ghost:hover {
          color: #1A1A18;
        }

        .tips-card {
          background: #FFFDF7;
          border: 1.5px solid #E8D9B0;
          border-radius: 14px;
          padding: 20px;
        }

        .tips-card h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #8B6914;
          margin-bottom: 14px;
        }

        .tips-card ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tips-card li {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.55;
          padding-left: 14px;
          position: relative;
        }

        .tips-card li::before {
          content: '·';
          position: absolute;
          left: 0;
          color: #C9A84C;
          font-size: 1.25rem;
          line-height: 1;
          top: 1px;
          font-weight: 700;
        }

        .new-dash-widgets {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .new-dash-widgets__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .selected-count {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #8B6914;
          background: #FFF8E6;
          border: 1px solid #E8D9B0;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .widget-picker {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 768px) {
          .widget-picker { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 480px) {
          .widget-picker { grid-template-columns: 1fr; }
        }

        .widget-option {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 18px 12px;
          background: #FAFAF8;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
        }

        .widget-option:hover {
          border-color: #C9A84C;
          background: #FFFDF7;
          transform: translateY(-1px);
        }

        .widget-option--selected {
          border-color: #8B6914;
          background: #FFFDF7;
        }

        .widget-option__icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #F0EDE8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B6914;
          flex-shrink: 0;
        }

        .widget-option--selected .widget-option__icon {
          background: #F5E9C8;
        }

        .widget-option__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .widget-option__desc {
          font-size: 0.75rem;
          color: #6B6B68;
          line-height: 1.4;
        }

        .widget-option__check {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 20px;
          height: 20px;
          background: #8B6914;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
      `}</style>
    </div>
  )
}