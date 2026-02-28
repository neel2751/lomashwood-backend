export default function ProductDetailLoading() {
  return (
    <div className="pdl">
      <div className="pdl__topbar">
        <div className="pdl__title-group">
          <div className="sk sk--back" />
          <div className="sk sk--title" />
          <div className="sk sk--subtitle" />
        </div>
        <div className="pdl__actions">
          <div className="sk sk--badge" />
          <div className="sk sk--btn" />
          <div className="sk sk--btn" />
          <div className="sk sk--btn-primary" />
        </div>
      </div>

      <div className="pdl__layout">
        <div className="pdl__main">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pdl__card">
              <div className="sk sk--card-title" />
              {Array.from({ length: i === 1 ? 2 : 6 }).map((_, j) => (
                <div key={j} className="pdl__row">
                  <div className="sk sk--label" />
                  <div className="sk sk--value" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="pdl__sidebar">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pdl__sidebar-card">
              <div className="sk sk--sidebar-title" />
              <div className="pdl__sidebar-body">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="sk sk--sidebar-item" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pdl {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .pdl__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .pdl__title-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pdl__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 4px;
        }

        .pdl__layout {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .pdl__layout { grid-template-columns: 1fr; }
        }

        .pdl__main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pdl__card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pdl__row {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #F0EDE8;
        }

        .pdl__sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pdl__sidebar-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pdl__sidebar-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sk {
          border-radius: 6px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        .sk--back          { height: 14px; width: 90px; border-radius: 4px; }
        .sk--title         { height: 28px; width: 280px; }
        .sk--subtitle      { height: 16px; width: 160px; border-radius: 4px; }
        .sk--badge         { height: 26px; width: 70px; border-radius: 20px; }
        .sk--btn           { height: 38px; width: 100px; border-radius: 8px; }
        .sk--btn-primary   { height: 38px; width: 120px; border-radius: 8px; }
        .sk--card-title    { height: 12px; width: 140px; border-radius: 4px; }
        .sk--label         { height: 13px; width: 100px; border-radius: 4px; }
        .sk--value         { height: 16px; width: 180px; border-radius: 4px; }
        .sk--sidebar-title { height: 12px; width: 90px; border-radius: 4px; }
        .sk--sidebar-item  { height: 36px; border-radius: 8px; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}