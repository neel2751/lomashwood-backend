import { Suspense } from 'react'

import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { TrackingTable } from '@/components/analytics/TrackingTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExportButton } from '@/components/shared/ExportButton'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Event Tracking | Analytics',
}

export default function AnalyticsTrackingPage() {
  return (
    <div className="tracking-page">
      <div className="tracking-page__topbar">
        <PageHeader
          title="Event Tracking"
          description="All GTM events, custom interactions, and page-view logs captured from the website."
          backHref="/analytics"
          backLabel="Analytics"
        />
        <div className="tracking-page__actions">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
          <ExportButton label="Export CSV" />
        </div>
      </div>

      <div className="tracking-page__filters">
        <select className="filter-select" defaultValue="">
          <option value="" disabled>Event type</option>
          <option value="page_view">Page View</option>
          <option value="click">Click</option>
          <option value="form_submit">Form Submit</option>
          <option value="scroll">Scroll Depth</option>
          <option value="video">Video</option>
          <option value="custom">Custom</option>
        </select>

        <select className="filter-select" defaultValue="">
          <option value="" disabled>Source</option>
          <option value="gtm">GTM</option>
          <option value="ga4">GA4</option>
          <option value="custom">Custom SDK</option>
        </select>

        <input
          type="search"
          className="filter-search"
          placeholder="Search events…"
        />
      </div>

      <Suspense fallback={<div className="table-skeleton" />}>
        <TrackingTable />
      </Suspense>

      <style>{`
        .tracking-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tracking-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tracking-page__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding-top: 4px;
        }

        .tracking-page__filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-select {
          height: 38px;
          padding: 0 12px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #1A1A18;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236B6B68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 34px;
        }

        .filter-select:focus {
          border-color: #8B6914;
        }

        .filter-search {
          height: 38px;
          padding: 0 14px;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          background: #FFFFFF;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #1A1A18;
          outline: none;
          transition: border-color 0.15s;
          min-width: 220px;
        }

        .filter-search:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
        }

        .filter-search::placeholder {
          color: #B8B5AE;
        }

        .table-skeleton {
          height: 480px;
          border-radius: 12px;
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