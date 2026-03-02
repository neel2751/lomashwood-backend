type DashboardBuilderProps = {
  dashboardId: string
  readOnly: boolean
}

export function DashboardBuilder({ dashboardId, readOnly }: DashboardBuilderProps) {
  return (
    <div className="dashboard-builder">
      <div className="dashboard-builder__grid">
        {readOnly ? (
          <div className="dashboard-builder__empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C8C4BC" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <p className="dashboard-builder__empty-text">
              No widgets configured yet.
            </p>
            <p className="dashboard-builder__empty-sub">
              Click <strong>Edit</strong> to start adding widgets to this dashboard.
            </p>
          </div>
        ) : (
          <div className="dashboard-builder__edit-hint">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <p>Drag and drop widgets here to build your dashboard: <strong>{dashboardId}</strong></p>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-builder {
          width: 100%;
          min-height: 480px;
          border-radius: 14px;
          border: 1.5px dashed #D8D5CF;
          background: #FAFAF8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dashboard-builder__grid {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .dashboard-builder__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }

        .dashboard-builder__empty-text {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #3A3A38;
          margin: 0;
        }

        .dashboard-builder__empty-sub {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #6B6B68;
          margin: 0;
        }

        .dashboard-builder__edit-hint {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: #FFF8E6;
          border: 1.5px solid #E8D9B0;
          border-radius: 10px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #8B6914;
        }
      `}</style>
    </div>
  )
}