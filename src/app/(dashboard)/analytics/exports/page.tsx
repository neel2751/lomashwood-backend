import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { ExportModal } from '@/components/analytics/ExportModal'

export const metadata: Metadata = {
  title: 'Exports | Analytics',
}

type ExportRecord = {
  id: string
  name: string
  type: 'csv' | 'excel' | 'json'
  dataSource: string
  rows: number
  size: string
  status: 'ready' | 'processing' | 'failed'
  requestedAt: string
  requestedBy: string
}

const exports: ExportRecord[] = [
  {
    id: 'exp-001',
    name: 'All Events — Oct 2024',
    type: 'csv',
    dataSource: 'Event Tracking',
    rows: 142_830,
    size: '18.2 MB',
    status: 'ready',
    requestedAt: '2 hours ago',
    requestedBy: 'You',
  },
  {
    id: 'exp-002',
    name: 'Funnel: Appointment Booking — Q3',
    type: 'excel',
    dataSource: 'Funnels',
    rows: 38_210,
    size: '4.7 MB',
    status: 'ready',
    requestedAt: 'Yesterday',
    requestedBy: 'Sarah M.',
  },
  {
    id: 'exp-003',
    name: 'Marketing Dashboard — Nov 2024',
    type: 'csv',
    dataSource: 'Custom Dashboard',
    rows: 0,
    size: '—',
    status: 'processing',
    requestedAt: '5 min ago',
    requestedBy: 'You',
  },
  {
    id: 'exp-004',
    name: 'Cohort Analysis — Sep 2024',
    type: 'json',
    dataSource: 'Funnels',
    rows: 12_450,
    size: '2.1 MB',
    status: 'failed',
    requestedAt: '3 days ago',
    requestedBy: 'James T.',
  },
]

const TYPE_ICONS: Record<string, string> = {
  csv: 'CSV',
  excel: 'XLS',
  json: 'JSON',
}

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  csv:   { color: '#27AE60', bg: '#EAF7EF' },
  excel: { color: '#1D6F42', bg: '#E6F4EA' },
  json:  { color: '#2980B9', bg: '#EBF4FB' },
}

const STATUS_CONFIG = {
  ready:      { label: 'Ready',      color: '#27AE60', bg: '#EAF7EF' },
  processing: { label: 'Processing', color: '#D4820A', bg: '#FFF3DC' },
  failed:     { label: 'Failed',     color: '#C0392B', bg: '#FDF2F2' },
}

export default function ExportsPage() {
  return (
    <div className="exports-page">
      <div className="exports-page__topbar">
        <PageHeader
          title="Exports"
          description="Download analytics data as CSV, Excel, or JSON. Exports are available for 7 days."
          backHref="/analytics"
          backLabel="Analytics"
        />
        <div className="exports-page__actions">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
          <Suspense fallback={null}>
            <ExportModal />
          </Suspense>
        </div>
      </div>

      <div className="exports-summary">
        {[
          { label: 'Total Exports', value: exports.length.toString() },
          { label: 'Ready', value: exports.filter(e => e.status === 'ready').length.toString() },
          { label: 'Processing', value: exports.filter(e => e.status === 'processing').length.toString() },
          { label: 'Storage Used', value: '25.0 MB' },
        ].map(({ label, value }) => (
          <div key={label} className="exports-summary__tile">
            <span className="exports-summary__label">{label}</span>
            <span className="exports-summary__value">{value}</span>
          </div>
        ))}
      </div>

      <div className="exports-table-wrapper">
        <table className="exports-table">
          <thead>
            <tr>
              <th>Export</th>
              <th>Source</th>
              <th>Format</th>
              <th>Rows</th>
              <th>Size</th>
              <th>Status</th>
              <th>Requested</th>
              <th>By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exports.map((exp) => {
              const typeStyle = TYPE_COLORS[exp.type]
              const statusStyle = STATUS_CONFIG[exp.status]
              return (
                <tr key={exp.id}>
                  <td className="td-name">{exp.name}</td>
                  <td className="td-source">{exp.dataSource}</td>
                  <td>
                    <span
                      className="format-badge"
                      style={{ color: typeStyle.color, background: typeStyle.bg }}
                    >
                      {TYPE_ICONS[exp.type]}
                    </span>
                  </td>
                  <td className="td-mono">
                    {exp.status === 'processing' ? '—' : exp.rows.toLocaleString()}
                  </td>
                  <td className="td-mono td-muted">{exp.size}</td>
                  <td>
                    <span
                      className="status-pill"
                      style={{ color: statusStyle.color, background: statusStyle.bg }}
                    >
                      {exp.status === 'processing' && (
                        <span className="status-spinner" aria-hidden="true" />
                      )}
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="td-muted">{exp.requestedAt}</td>
                  <td className="td-muted">{exp.requestedBy}</td>
                  <td className="td-actions">
                    {exp.status === 'ready' && (
                      <button className="action-btn action-btn--download" title="Download">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    )}
                    {exp.status === 'failed' && (
                      <button className="action-btn action-btn--retry" title="Retry">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="1 4 1 10 7 10"/>
                          <path d="M3.51 15a9 9 0 1 0 .49-3.91"/>
                        </svg>
                      </button>
                    )}
                    <button className="action-btn action-btn--delete" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="exports-note">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Exports are automatically deleted after 7 days. Download files promptly.
      </p>

      <style>{`
        .exports-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .exports-page__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .exports-page__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding-top: 4px;
        }

        .exports-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 900px) {
          .exports-summary { grid-template-columns: repeat(2, 1fr); }
        }

        .exports-summary__tile {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .exports-summary__label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6B68;
        }

        .exports-summary__value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A1A18;
          font-variant-numeric: tabular-nums;
        }

        .exports-table-wrapper {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          overflow: hidden;
          overflow-x: auto;
        }

        .exports-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .exports-table thead tr {
          border-bottom: 1.5px solid #E8E6E1;
        }

        .exports-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6B6B68;
          background: #FAFAF8;
        }

        .exports-table tbody tr {
          border-bottom: 1px solid #F0EDE8;
          transition: background 0.1s;
        }

        .exports-table tbody tr:last-child {
          border-bottom: none;
        }

        .exports-table tbody tr:hover {
          background: #FAFAF8;
        }

        .exports-table td {
          padding: 13px 16px;
          color: #1A1A18;
          vertical-align: middle;
        }

        .td-name {
          font-weight: 500;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .td-source {
          color: #6B6B68;
        }

        .td-mono {
          font-family: 'DM Mono', monospace;
          font-size: 0.8125rem;
        }

        .td-muted {
          color: #6B6B68;
        }

        .format-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .status-spinner {
          width: 10px;
          height: 10px;
          border: 1.5px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          opacity: 0.7;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .td-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-btn {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: #6B6B68;
          transition: background 0.15s, color 0.15s;
        }

        .action-btn:hover {
          background: #F0EDE8;
          color: #1A1A18;
        }

        .action-btn--download:hover {
          background: #EAF7EF;
          color: #27AE60;
        }

        .action-btn--retry:hover {
          background: #FFF3DC;
          color: #D4820A;
        }

        .action-btn--delete:hover {
          background: #FDF2F2;
          color: #C0392B;
        }

        .exports-note {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.8125rem;
          color: #6B6B68;
          padding: 0 2px;
        }
      `}</style>
    </div>
  )
}