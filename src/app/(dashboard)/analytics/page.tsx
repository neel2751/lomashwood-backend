import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { MetricCard } from '@/components/analytics/MetricCard'
import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { ExportButton } from '@/components/shared/ExportButton'

export const metadata: Metadata = {
  title: 'Analytics',
}

const quickLinks = [
  {
    href: '/analytics/tracking',
    label: 'Event Tracking',
    description: 'All GTM events and custom page-view logs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/analytics/funnels',
    label: 'Funnels',
    description: 'Conversion funnels and drop-off analysis',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    ),
  },
  {
    href: '/analytics/dashboards',
    label: 'Custom Dashboards',
    description: 'Build and share analytics dashboards',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/analytics/exports',
    label: 'Exports',
    description: 'Download analytics data as CSV or Excel',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
]

const metrics = [
  { label: 'Page Views', value: '142,830', delta: '+9.3%', trend: 'up' as const },
  { label: 'Unique Visitors', value: '38,210', delta: '+14.1%', trend: 'up' as const },
  { label: 'Avg. Session', value: '3m 42s', delta: '+0:18', trend: 'up' as const },
  { label: 'Bounce Rate', value: '41.2%', delta: '-2.8%', trend: 'up' as const },
  { label: 'Conversion Rate', value: '3.84%', delta: '+0.41%', trend: 'up' as const },
  { label: 'Goal Completions', value: '1,468', delta: '+22.6%', trend: 'up' as const },
]

export default function AnalyticsPage() {
  return (
    <div className="analytics-overview">
      <div className="analytics-overview__topbar">
        <PageHeader
          title="Analytics"
          description="Traffic, behaviour, and conversion metrics across all channels."
        />
        <div className="analytics-overview__actions">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
          <ExportButton label="Export" />
        </div>
      </div>

      <section className="analytics-overview__metrics">
        {metrics.map((m) => (
          <Suspense key={m.label} fallback={<div className="metric-skeleton" />}>
            <MetricCard {...m} />
          </Suspense>
        ))}
      </section>

      <section className="analytics-overview__nav">
        <h2 className="analytics-overview__nav-title">Explore</h2>
        <div className="analytics-overview__nav-grid">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="analytics-nav-card">
              <span className="analytics-nav-card__icon">{link.icon}</span>
              <span className="analytics-nav-card__body">
                <span className="analytics-nav-card__label">{link.label}</span>
                <span className="analytics-nav-card__desc">{link.description}</span>
              </span>
              <svg className="analytics-nav-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        .analytics-overview {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .analytics-overview__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .analytics-overview__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding-top: 4px;
        }

        .analytics-overview__metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .analytics-overview__metrics {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .analytics-overview__metrics {
            grid-template-columns: 1fr;
          }
        }

        .metric-skeleton {
          height: 100px;
          border-radius: 12px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .analytics-overview__nav-title {
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6B6B68;
          margin-bottom: 12px;
        }

        .analytics-overview__nav-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (max-width: 768px) {
          .analytics-overview__nav-grid {
            grid-template-columns: 1fr;
          }
        }

        .analytics-nav-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }

        .analytics-nav-card:hover {
          border-color: #C9A84C;
          box-shadow: 0 2px 12px rgba(139, 105, 20, 0.1);
          transform: translateY(-1px);
        }

        .analytics-nav-card__icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #F7F5F0;
          border: 1px solid #E8E0D0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B6914;
          flex-shrink: 0;
        }

        .analytics-nav-card__body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .analytics-nav-card__label {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1A1A18;
        }

        .analytics-nav-card__desc {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.4;
        }

        .analytics-nav-card__arrow {
          color: #B8B5AE;
          flex-shrink: 0;
          transition: color 0.15s, transform 0.15s;
        }

        .analytics-nav-card:hover .analytics-nav-card__arrow {
          color: #8B6914;
          transform: translateX(2px);
        }
      `}</style>
    </div>
  )
}