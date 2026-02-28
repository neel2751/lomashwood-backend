import { Suspense } from 'react'

import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboards | Analytics',
}

type Dashboard = {
  id: string
  name: string
  description: string
  widgetCount: number
  owner: string
  visibility: 'private' | 'team' | 'public'
  updatedAt: string
  thumbnail: string
}

const dashboards: Dashboard[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level revenue, orders, and appointment KPIs for leadership.',
    widgetCount: 8,
    owner: 'You',
    visibility: 'team',
    updatedAt: '30 min ago',
    thumbnail: '#1A1A18',
  },
  {
    id: 'marketing-performance',
    name: 'Marketing Performance',
    description: 'UTM tracking, channel attribution, and campaign conversions.',
    widgetCount: 12,
    owner: 'Sarah M.',
    visibility: 'team',
    updatedAt: '2 hours ago',
    thumbnail: '#8B6914',
  },
  {
    id: 'product-insights',
    name: 'Product Insights',
    description: 'Top-viewed kitchens & bedrooms, colour popularity, and filter usage.',
    widgetCount: 6,
    owner: 'You',
    visibility: 'private',
    updatedAt: 'Yesterday',
    thumbnail: '#2C5F4A',
  },
  {
    id: 'appointment-ops',
    name: 'Appointment Operations',
    description: 'Booking rates, showroom utilisation, and consultant capacity.',
    widgetCount: 9,
    owner: 'James T.',
    visibility: 'public',
    updatedAt: '3 days ago',
    thumbnail: '#3D3580',
  },
]

const visibilityConfig = {
  private: { label: 'Private', color: '#6B6B68', bg: '#F0EDE8' },
  team: { label: 'Team', color: '#2980B9', bg: '#EBF4FB' },
  public: { label: 'Public', color: '#27AE60', bg: '#EAF7EF' },
}

export default function DashboardsListPage() {
  return (
    <div className="dashboards-page">
      <div className="dashboards-page__topbar">
        <PageHeader
          title="Custom Dashboards"
          description="Build, share, and explore analytics dashboards tailored to your team."
          backHref="/analytics"
          backLabel="Analytics"
        />
        <Link href="/analytics/dashboards/new" className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Dashboard
        </Link>
      </div>

      <div className="dashboards-page__tabs">
        {['All', 'Mine', 'Shared with me', 'Public'].map((tab, i) => (
          <button key={tab} className={`tab${i === 0 ? ' tab--active' : ''}`}>
            {tab}
          </button>
        ))}
      </div>

      {dashboards.length === 0 ? (
        <div className="dashboards-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <p>No dashboards yet. Create your first to start visualising your data.</p>
          <Link href="/analytics/dashboards/new" className="btn-primary">Create dashboard</Link>
        </div>
      ) : (
        <div className="dashboards-grid">
          {dashboards.map((dash) => {
            const vis = visibilityConfig[dash.visibility]
            return (
              <Link key={dash.id} href={`/analytics/dashboards/${dash.id}`} className="dash-card">
                <div className="dash-card__thumb" style={{ background: dash.thumbnail }}>
                  <div className="dash-card__thumb-grid" aria-hidden="true">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="dash-card__thumb-block" />
                    ))}
                  </div>
                </div>
                <div className="dash-card__body">
                  <div className="dash-card__header">
                    <span className="dash-card__name">{dash.name}</span>
                    <span
                      className="dash-card__visibility"
                      style={{ color: vis.color, background: vis.bg }}
                    >
                      {vis.label}
                    </span>
                  </div>
                  <p className="dash-card__desc">{dash.description}</p>
                  <div className="dash-card__meta">
                    <span className="dash-card__meta-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      {dash.widgetCount} widgets
                    </span>
                    <span className="dash-card__meta-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {dash.owner}
                    </span>
                    <span className="dash-card__meta-item dash-card__meta-item--muted">
                      {dash.updatedAt}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}

          <Link href="/analytics/dashboards/new" className="dash-card dash-card--new">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>New Dashboard</span>
          </Link>
        </div>
      )}

      <style>{`
        .dashboards-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboards-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 16px;
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
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .btn-primary:hover {
          background: #2E2E2A;
        }

        .dashboards-page__tabs {
          display: flex;
          gap: 2px;
          border-bottom: 1.5px solid #E8E6E1;
          padding-bottom: 0;
        }

        .tab {
          height: 38px;
          padding: 0 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1.5px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6B6B68;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .tab:hover {
          color: #1A1A18;
        }

        .tab--active {
          color: #1A1A18;
          border-bottom-color: #1A1A18;
          font-weight: 600;
        }

        .dashboards-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 24px;
          background: #FFFFFF;
          border: 1.5px dashed #D8D5CE;
          border-radius: 14px;
          text-align: center;
          color: #6B6B68;
        }

        .dashboards-empty p {
          font-size: 0.9375rem;
          max-width: 320px;
          line-height: 1.6;
        }

        .dashboards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        @media (max-width: 1200px) {
          .dashboards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .dashboards-grid { grid-template-columns: 1fr; }
        }

        .dash-card {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          overflow: hidden;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }

        .dash-card:hover {
          border-color: #C9A84C;
          box-shadow: 0 4px 20px rgba(139, 105, 20, 0.1);
          transform: translateY(-2px);
        }

        .dash-card__thumb {
          height: 110px;
          position: relative;
          overflow: hidden;
        }

        .dash-card__thumb-grid {
          position: absolute;
          inset: 12px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 6px;
        }

        .dash-card__thumb-block {
          background: rgba(255,255,255,0.12);
          border-radius: 4px;
        }

        .dash-card__body {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dash-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .dash-card__name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .dash-card__visibility {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 20px;
          flex-shrink: 0;
        }

        .dash-card__desc {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.5;
        }

        .dash-card__meta {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .dash-card__meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          color: #6B6B68;
        }

        .dash-card__meta-item--muted {
          color: #B8B5AE;
          margin-left: auto;
        }

        .dash-card--new {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 200px;
          background: #FAFAF8;
          border-style: dashed;
          color: #B8B5AE;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }

        .dash-card--new:hover {
          border-color: #8B6914;
          color: #8B6914;
          background: #FFFDF7;
          transform: translateY(-2px);
          box-shadow: none;
        }
      `}</style>
    </div>
  )
}