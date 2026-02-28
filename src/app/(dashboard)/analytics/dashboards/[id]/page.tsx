import { Suspense } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DashboardBuilder } from '@/components/analytics/DashboardBuilder'
import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExportButton } from '@/components/shared/ExportButton'

import type { Metadata } from 'next'

type Props = {
  params: { id: string }
  searchParams: { edit?: string }
}

type DashboardData = {
  id: string
  name: string
  description: string
  widgetCount: number
  owner: string
  visibility: 'private' | 'team' | 'public'
  updatedAt: string
}

const DASHBOARDS: Record<string, DashboardData> = {
  'executive-summary': {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level revenue, orders, and appointment KPIs for leadership.',
    widgetCount: 8,
    owner: 'You',
    visibility: 'team',
    updatedAt: '30 min ago',
  },
  'marketing-performance': {
    id: 'marketing-performance',
    name: 'Marketing Performance',
    description: 'UTM tracking, channel attribution, and campaign conversions.',
    widgetCount: 12,
    owner: 'Sarah M.',
    visibility: 'team',
    updatedAt: '2 hours ago',
  },
  'product-insights': {
    id: 'product-insights',
    name: 'Product Insights',
    description: 'Top-viewed kitchens & bedrooms, colour popularity, and filter usage.',
    widgetCount: 6,
    owner: 'You',
    visibility: 'private',
    updatedAt: 'Yesterday',
  },
  'appointment-ops': {
    id: 'appointment-ops',
    name: 'Appointment Operations',
    description: 'Booking rates, showroom utilisation, and consultant capacity.',
    widgetCount: 9,
    owner: 'James T.',
    visibility: 'public',
    updatedAt: '3 days ago',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dashboard = DASHBOARDS[params.id]
  return {
    title: dashboard
      ? `${dashboard.name} | Dashboards`
      : 'Dashboard | Analytics',
  }
}

const visibilityConfig = {
  private: { label: 'Private', color: '#6B6B68', bg: '#F0EDE8' },
  team:    { label: 'Team',    color: '#2980B9', bg: '#EBF4FB' },
  public:  { label: 'Public',  color: '#27AE60', bg: '#EAF7EF' },
}

export default function DashboardDetailPage({ params, searchParams }: Props) {
  const dashboard = DASHBOARDS[params.id]
  const isEditMode = searchParams.edit === 'true'

  if (!dashboard) {
    notFound()
  }

  const vis = visibilityConfig[dashboard.visibility]

  return (
    <div className="dash-detail">
      <div className="dash-detail__topbar">
        <div className="dash-detail__title-group">
          <PageHeader
            title={dashboard.name}
            description={dashboard.description}
            backHref="/analytics/dashboards"
            backLabel="Dashboards"
          />
          <div className="dash-detail__badges">
            <span
              className="dash-badge"
              style={{ color: vis.color, background: vis.bg }}
            >
              {vis.label}
            </span>
            <span className="dash-badge dash-badge--neutral">
              {dashboard.widgetCount} widgets
            </span>
            <span className="dash-badge dash-badge--neutral">
              Updated {dashboard.updatedAt}
            </span>
          </div>
        </div>

        <div className="dash-detail__actions">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
          <ExportButton label="Export" />
          {isEditMode ? (
            <>
              <Link
                href={`/analytics/dashboards/${params.id}`}
                className="btn-ghost"
              >
                Cancel
              </Link>
              <button className="btn-primary">
                Save changes
              </button>
            </>
          ) : (
            <Link
              href={`/analytics/dashboards/${params.id}?edit=true`}
              className="btn-outline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </Link>
          )}
          <button className="btn-icon" title="Share dashboard" aria-label="Share dashboard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="edit-mode-banner">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          You are in edit mode. Drag widgets to reorder, or click a widget to configure it.
        </div>
      )}

      <div className="dash-detail__canvas">
        <Suspense fallback={<div className="canvas-skeleton" />}>
          <DashboardBuilder dashboardId={params.id} readOnly={!isEditMode} />
        </Suspense>
      </div>

      <style>{`
        .dash-detail {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .dash-detail__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dash-detail__title-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dash-detail__badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .dash-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .dash-badge--neutral {
          color: #6B6B68;
          background: #F0EDE8;
        }

        .dash-detail__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding-top: 4px;
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
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }

        .btn-primary:hover {
          background: #2E2E2A;
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 14px;
          background: #FFFFFF;
          color: #1A1A18;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.15s;
          white-space: nowrap;
        }

        .btn-outline:hover {
          border-color: #1A1A18;
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 12px;
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

        .btn-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          color: #6B6B68;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .btn-icon:hover {
          border-color: #1A1A18;
          color: #1A1A18;
        }

        .edit-mode-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #FFF8E6;
          border: 1.5px solid #E8D9B0;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #8B6914;
          font-weight: 500;
        }

        .dash-detail__canvas {
          min-height: 480px;
        }

        .canvas-skeleton {
          height: 480px;
          border-radius: 14px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}