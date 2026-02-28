import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { FunnelChart } from '@/components/analytics/FunnelChart'
import { CohortTable } from '@/components/analytics/CohortTable'
import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { ExportButton } from '@/components/shared/ExportButton'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Funnel: ${params.id} | Analytics`,
  }
}

async function getFunnel(id: string) {
  const funnels: Record<string, { name: string; steps: number; entryCount: number; conversionRate: number }> = {
    'appt-booking': { name: 'Appointment Booking', steps: 4, entryCount: 12840, conversionRate: 18.3 },
    'brochure-request': { name: 'Brochure Request', steps: 3, entryCount: 8210, conversionRate: 31.6 },
    'product-enquiry': { name: 'Product Enquiry', steps: 5, entryCount: 6450, conversionRate: 12.4 },
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
          { label: 'Total Entries', value: funnel.entryCount.toLocaleString(), sub: 'last 30 days' },
          { label: 'Completed', value: Math.round(funnel.entryCount * funnel.conversionRate / 100).toLocaleString(), sub: 'conversions' },
          { label: 'Conversion Rate', value: `${funnel.conversionRate}%`, sub: 'entry → goal', accent: true },
          { label: 'Avg. Time to Convert', value: '8m 24s', sub: 'median session' },
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

        .kpi-tile__value--accent {
          color: #8B6914;
        }

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