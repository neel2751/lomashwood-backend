export default function AnalyticsLoading() {
  return (
    <div className="analytics-loading">
      <div className="al-topbar">
        <div className="al-title-group">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--subtitle" />
        </div>
        <div className="al-actions">
          <div className="skeleton skeleton--btn" />
          <div className="skeleton skeleton--btn" />
        </div>
      </div>

      <div className="al-metrics">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton--metric" />
        ))}
      </div>

      <div className="al-nav">
        <div className="skeleton skeleton--section-label" />
        <div className="al-nav-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--nav-card" />
          ))}
        </div>
      </div>

      <style>{`
        .analytics-loading {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .al-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .al-title-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .al-actions {
          display: flex;
          gap: 10px;
          padding-top: 4px;
        }

        .al-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .al-metrics { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .al-metrics { grid-template-columns: 1fr; }
        }

        .al-nav-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (max-width: 768px) {
          .al-nav-grid { grid-template-columns: 1fr; }
        }

        .skeleton {
          border-radius: 8px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .skeleton--title    { height: 32px; width: 180px; border-radius: 6px; }
        .skeleton--subtitle { height: 18px; width: 340px; border-radius: 4px; }
        .skeleton--btn      { height: 38px; width: 120px; border-radius: 8px; }
        .skeleton--metric   { height: 100px; border-radius: 12px; }
        .skeleton--section-label { height: 14px; width: 80px; border-radius: 4px; margin-bottom: 12px; }
        .skeleton--nav-card { height: 80px; border-radius: 12px; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}