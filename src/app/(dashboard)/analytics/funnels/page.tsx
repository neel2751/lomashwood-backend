import { Suspense } from 'react'

import Link from 'next/link'

import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { FunnelChart } from '@/components/analytics/FunnelChart'
import { PageHeader } from '@/components/layout/PageHeader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Funnels | Analytics',
}

const funnels = [
  {
    id: 'appt-booking',
    name: 'Appointment Booking',
    steps: 4,
    entryCount: 12_840,
    conversionRate: 18.3,
    lastUpdated: '2 hours ago',
  },
  {
    id: 'brochure-request',
    name: 'Brochure Request',
    steps: 3,
    entryCount: 8_210,
    conversionRate: 31.6,
    lastUpdated: '5 hours ago',
  },
  {
    id: 'product-enquiry',
    name: 'Product Enquiry',
    steps: 5,
    entryCount: 6_450,
    conversionRate: 12.4,
    lastUpdated: '1 day ago',
  },
]

export default function FunnelsListPage() {
  return (
    <div className="funnels-page">
      <div className="funnels-page__topbar">
        <PageHeader
          title="Funnels"
          description="Track conversion paths and identify where users drop off."
          backHref="/analytics"
          backLabel="Analytics"
        />
        <div className="funnels-page__actions">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
          <Link href="/analytics/funnels/new" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Funnel
          </Link>
        </div>
      </div>

      {funnels.length === 0 ? (
        <div className="funnels-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <p>No funnels yet. Create your first funnel to start tracking conversions.</p>
          <Link href="/analytics/funnels/new" className="btn-primary">Create funnel</Link>
        </div>
      ) : (
        <div className="funnels-grid">
          {funnels.map((funnel) => (
            <Link key={funnel.id} href={`/analytics/funnels/${funnel.id}`} className="funnel-card">
              <div className="funnel-card__header">
                <span className="funnel-card__name">{funnel.name}</span>
                <span className="funnel-card__steps">{funnel.steps} steps</span>
              </div>
              <div className="funnel-card__stats">
                <div className="funnel-card__stat">
                  <span className="funnel-card__stat-label">Entries</span>
                  <span className="funnel-card__stat-value">{funnel.entryCount.toLocaleString()}</span>
                </div>
                <div className="funnel-card__stat">
                  <span className="funnel-card__stat-label">Conversion</span>
                  <span className="funnel-card__stat-value funnel-card__stat-value--accent">
                    {funnel.conversionRate}%
                  </span>
                </div>
              </div>
              <Suspense fallback={<div className="mini-chart-skeleton" />}>
                <FunnelChart funnelId={funnel.id} mini />
              </Suspense>
              <span className="funnel-card__updated">Updated {funnel.lastUpdated}</span>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .funnels-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .funnels-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .funnels-page__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding-top: 4px;
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
        }

        .btn-primary:hover {
          background: #2E2E2A;
        }

        .funnels-empty {
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

        .funnels-empty p {
          font-size: 0.9375rem;
          max-width: 320px;
          line-height: 1.6;
        }

        .funnels-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .funnels-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .funnels-grid { grid-template-columns: 1fr; }
        }

        .funnel-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 20px;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }

        .funnel-card:hover {
          border-color: #C9A84C;
          box-shadow: 0 4px 16px rgba(139, 105, 20, 0.1);
          transform: translateY(-2px);
        }

        .funnel-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .funnel-card__name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .funnel-card__steps {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6B6B68;
          background: #F0EDE8;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .funnel-card__stats {
          display: flex;
          gap: 20px;
        }

        .funnel-card__stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .funnel-card__stat-label {
          font-size: 0.75rem;
          color: #6B6B68;
          font-weight: 500;
        }

        .funnel-card__stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1A1A18;
          font-variant-numeric: tabular-nums;
        }

        .funnel-card__stat-value--accent {
          color: #8B6914;
        }

        .mini-chart-skeleton {
          height: 60px;
          border-radius: 8px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .funnel-card__updated {
          font-size: 0.75rem;
          color: #B8B5AE;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}