import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { FunnelBuilder } from '@/components/analytics/FunnelBuilder'

export const metadata: Metadata = {
  title: 'New Funnel | Analytics',
}

export default function NewFunnelPage() {
  return (
    <div className="new-funnel-page">
      <PageHeader
        title="New Funnel"
        description="Define the steps users take toward a conversion goal."
        backHref="/analytics/funnels"
        backLabel="Funnels"
      />

      <div className="new-funnel-page__layout">
        <div className="new-funnel-page__builder">
          <Suspense fallback={<div className="builder-skeleton" />}>
            <FunnelBuilder />
          </Suspense>
        </div>

        <aside className="new-funnel-page__tips">
          <div className="tips-card">
            <h3>Tips for effective funnels</h3>
            <ul>
              <li>Start with the entry point (e.g. product page visit) and end with the goal (e.g. appointment booked).</li>
              <li>Keep funnels to 3–6 steps for clearest drop-off analysis.</li>
              <li>Use URL conditions for page-based steps and event conditions for interaction-based steps.</li>
              <li>Add a date range after saving to see historical data immediately.</li>
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        .new-funnel-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .new-funnel-page__layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .new-funnel-page__layout {
            grid-template-columns: 1fr;
          }

          .new-funnel-page__tips {
            order: -1;
          }
        }

        .builder-skeleton {
          height: 520px;
          border-radius: 14px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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
          letter-spacing: 0.01em;
        }

        .tips-card ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0;
        }

        .tips-card li {
          font-size: 0.8125rem;
          color: #6B6B68;
          line-height: 1.55;
          padding-left: 16px;
          position: relative;
        }

        .tips-card li::before {
          content: '·';
          position: absolute;
          left: 0;
          font-size: 1.25rem;
          line-height: 1;
          top: 1px;
          color: #C9A84C;
          font-weight: 700;
        }
      `}</style>
    </div>
  )
}