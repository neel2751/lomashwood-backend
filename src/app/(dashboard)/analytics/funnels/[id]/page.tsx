import { Suspense } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExportButton } from '@/components/shared/ExportButton'

import type { Metadata } from 'next'

type Props = {
  params: { id: string }
}

type FunnelChartProps = { funnelId: string }
type CohortTableProps = { funnelId: string }

function FunnelChart({ funnelId }: FunnelChartProps) {
  const data: Record<string, { step: string; users: number }[]> = {
    'appt-booking': [
      { step: 'Landing Page',       users: 12840 },
      { step: 'Select Service',     users: 8920  },
      { step: 'Choose Date & Time', users: 5430  },
      { step: 'Confirm Booking',    users: 2350  },
    ],
    'brochure-request': [
      { step: 'Landing Page',   users: 8210 },
      { step: 'Fill Form',      users: 4100 },
      { step: 'Submit Request', users: 2594 },
    ],
    'product-enquiry': [
      { step: 'Product Page',    users: 6450 },
      { step: 'View Details',    users: 4200 },
      { step: 'Add to List',     users: 2800 },
      { step: 'Contact Form',    users: 1500 },
      { step: 'Submit Enquiry',  users: 800  },
    ],
  }

  const steps    = data[funnelId] ?? []
  const maxUsers = steps.length > 0 ? steps[0]!.users : 1

  return (
    <div className="funnel-chart">
      {steps.map((s, i) => {
        const pct     = Math.round((s.users / maxUsers) * 100)
        const prev    = steps[i - 1]
        const dropoff = i > 0 && prev ? Math.round((1 - s.users / prev.users) * 100) : null
        return (
          <div key={s.step} className="funnel-step">
            <div className="funnel-step__meta">
              <span className="funnel-step__name">{s.step}</span>
              <span className="funnel-step__count">{s.users.toLocaleString()}</span>
            </div>
            <div className="funnel-step__bar-track">
              <div className="funnel-step__bar" style={{ width: `${pct}%` }} />
            </div>
            {dropoff !== null && (
              <span className="funnel-step__dropoff">−{dropoff}% drop-off</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CohortTable({ funnelId: _funnelId }: CohortTableProps) {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
  const cohorts = [
    { label: 'Jan 2024', values: [100, 68, 51, 39] },
    { label: 'Feb 2024', values: [100, 72, 55, 42] },
    { label: 'Mar 2024', values: [100, 65, 48, 36] },
    { label: 'Apr 2024', values: [100, 70, 53, 41] },
  ]

  return (
    <div className="cohort-wrapper">
      <table className="cohort-table">
        <thead>
          <tr>
            <th>Cohort</th>
            {weeks.map(w => <th key={w}>{w}</th>)}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(row => (
            <tr key={row.label}>
              <td className="cohort-label">{row.label}</td>
              {row.values.map((val, i) => (
                <td
                  key={i}
                  className="cohort-cell"
                  style={{ background: `rgba(26,26,24,${val / 200})` }}
                >
                  {val}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Funnel: ${params.id} | Analytics`,
  }
}

async function getFunnel(id: string) {
  const funnels: Record<string, { name: string; steps: number; entryCount: number; conversionRate: number }> = {
    'appt-booking':     { name: 'Appointment Booking', steps: 4, entryCount: 12840, conversionRate: 18.3 },
    'brochure-request': { name: 'Brochure Request',    steps: 3, entryCount: 8210,  conversionRate: 31.6 },
    'product-enquiry':  { name: 'Product Enquiry',     steps: 5, entryCount: 6450,  conversionRate: 12.4 },
  }
  return funnels[id] ?? null
}

export default async function FunnelDetailPage({ params }: Props) {
  const funnel = await getFunnel(params.id)

  if (!funnel) {
    notFound()
  }

  return (
    <div className="funnel-detail">
      <div className="funnel-detail__topbar">
        <PageHeader
          title={funnel.name}
          description={`${funnel.steps} steps · ${funnel.entryCount.toLocaleString()} entries · ${funnel.conversionRate}% overall conversion`}
          backHref="/analytics/funnels"
          backLabel="Funnels"
        />
        <div className="funnel-detail__actions">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
          <ExportButton label="Export" />
          <Link href={`/analytics/funnels/${params.id}/edit`} className="btn-outline">
            Edit funnel
          </Link>
        </div>
      </div>

      <div className="funnel-detail__kpis">
        {[
          { label: 'Total Entries',        value: funnel.entryCount.toLocaleString(),                                           sub: 'last 30 days'   },
          { label: 'Completed',            value: Math.round(funnel.entryCount * funnel.conversionRate / 100).toLocaleString(),  sub: 'conversions'    },
          { label: 'Conversion Rate',      value: `${funnel.conversionRate}%`,                                                   sub: 'entry → goal',  accent: true },
          { label: 'Avg. Time to Convert', value: '8m 24s',                                                                      sub: 'median session' },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-tile">
            <span className="kpi-tile__label">{kpi.label}</span>
            <span className={`kpi-tile__value${kpi.accent ? ' kpi-tile__value--accent' : ''}`}>
              {kpi.value}
            </span>
            <span className="kpi-tile__sub">{kpi.sub}</span>
          </div>
        ))}
      </div>

      <div className="funnel-detail__chart-section">
        <h2 className="section-title">Step-by-step breakdown</h2>
        <Suspense fallback={<div className="chart-skeleton" />}>
          <FunnelChart funnelId={params.id} />
        </Suspense>
      </div>

      <div className="funnel-detail__cohort-section">
        <h2 className="section-title">Cohort analysis</h2>
        <Suspense fallback={<div className="chart-skeleton" />}>
          <CohortTable funnelId={params.id} />
        </Suspense>
      </div>

      <style>{`
        .funnel-detail {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .funnel-detail__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .funnel-detail__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding-top: 4px;
        }
        .btn-outline {
          display: inline-flex;
          align-items: center;
          height: 38px;
          padding: 0 16px;
          background: #FFFFFF;
          color: #1A1A18;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .btn-outline:hover {
          border-color: #1A1A18;
          background: #FAFAF8;
        }
        .funnel-detail__kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 1100px) {
          .funnel-detail__kpis { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .funnel-detail__kpis { grid-template-columns: 1fr; }
        }
        .kpi-tile {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 20px;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
        }
        .kpi-tile__label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }
        .kpi-tile__value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1A1A18;
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }
        .kpi-tile__value--accent { color: #8B6914; }
        .kpi-tile__sub {
          font-size: 0.8125rem;
          color: #B8B5AE;
        }
        .section-title {
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
          margin-bottom: 12px;
        }
        .funnel-chart {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .funnel-step__meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 0.875rem;
        }
        .funnel-step__name  { font-weight: 500; color: #1A1A18; }
        .funnel-step__count { font-weight: 600; color: #1A1A18; font-variant-numeric: tabular-nums; }
        .funnel-step__bar-track {
          height: 10px;
          background: #F0EDE8;
          border-radius: 99px;
          overflow: hidden;
        }
        .funnel-step__bar {
          height: 100%;
          background: #1A1A18;
          border-radius: 99px;
          transition: width 0.4s ease;
        }
        .funnel-step__dropoff {
          font-size: 0.75rem;
          color: #C0392B;
          margin-top: 4px;
          display: block;
        }
        .cohort-wrapper {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          overflow: hidden;
          overflow-x: auto;
        }
        .cohort-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .cohort-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6B6B68;
          background: #FAFAF8;
          border-bottom: 1.5px solid #E8E6E1;
        }
        .cohort-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #F0EDE8;
        }
        .cohort-table tr:last-child td { border-bottom: none; }
        .cohort-label { font-weight: 500; color: #1A1A18; }
        .cohort-cell {
          font-variant-numeric: tabular-nums;
          font-weight: 500;
          color: #1A1A18;
          text-align: center;
        }
        .chart-skeleton {
          height: 300px;
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
export const dynamic = 'force-dynamic'
