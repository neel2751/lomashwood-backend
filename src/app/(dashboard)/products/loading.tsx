export default function ProductsLoading() {
  return (
    <div className="pl">
      <div className="pl__topbar">
        <div className="pl__title-group">
          <div className="sk sk--title" />
          <div className="sk sk--subtitle" />
        </div>
        <div className="pl__actions">
          <div className="sk sk--btn" />
          <div className="sk sk--btn-primary" />
        </div>
      </div>

      <div className="pl__subnav">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="sk sk--tab" />
        ))}
      </div>

      <div className="pl__stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk sk--stat" />
        ))}
      </div>

      <div className="pl__filters">
        <div className="pl__filter-left">
          <div className="sk sk--search" />
          <div className="sk sk--select" />
          <div className="sk sk--select" />
          <div className="sk sk--select" />
        </div>
        <div className="pl__filter-right">
          <div className="sk sk--icon" />
          <div className="sk sk--icon" />
        </div>
      </div>

      <div className="pl__table">
        <div className="pl__table-head">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="sk sk--th" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="pl__table-row">
            <div className="sk sk--thumb" />
            <div className="pl__table-row-text">
              <div className="sk sk--row-title" />
              <div className="sk sk--row-sub" />
            </div>
            <div className="sk sk--cell" />
            <div className="sk sk--badge" />
            <div className="sk sk--cell-sm" />
            <div className="sk sk--cell-sm" />
          </div>
        ))}
      </div>

      <style>{`
        .pl {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .pl__topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .pl__title-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pl__actions {
          display: flex;
          gap: 10px;
          padding-top: 4px;
        }

        .pl__subnav {
          display: flex;
          gap: 8px;
          border-bottom: 1.5px solid #E8E6E1;
          padding-bottom: 10px;
        }

        .pl__stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 900px) {
          .pl__stats { grid-template-columns: repeat(2, 1fr); }
        }

        .pl__filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .pl__filter-left {
          display: flex;
          gap: 8px;
        }

        .pl__filter-right {
          display: flex;
          gap: 4px;
        }

        .pl__table {
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .pl__table-head {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 20px;
          border-bottom: 1.5px solid #E8E6E1;
          background: #FAFAF8;
        }

        .pl__table-row {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 20px;
          border-bottom: 1px solid #F0EDE8;
        }

        .pl__table-row:last-child { border-bottom: none; }

        .pl__table-row-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sk {
          border-radius: 6px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        .sk--title        { height: 28px; width: 160px; }
        .sk--subtitle     { height: 16px; width: 300px; }
        .sk--btn          { height: 38px; width: 90px; border-radius: 8px; }
        .sk--btn-primary  { height: 38px; width: 120px; border-radius: 8px; }
        .sk--tab          { height: 16px; width: 80px; border-radius: 4px; }
        .sk--stat         { height: 82px; border-radius: 12px; }
        .sk--search       { height: 38px; width: 220px; border-radius: 8px; }
        .sk--select       { height: 38px; width: 100px; border-radius: 8px; }
        .sk--icon         { height: 36px; width: 36px; border-radius: 8px; }
        .sk--thumb        { height: 44px; width: 44px; border-radius: 8px; }
        .sk--row-title    { height: 14px; width: 160px; border-radius: 4px; }
        .sk--row-sub      { height: 12px; width: 100px; border-radius: 4px; }
        .sk--cell         { height: 14px; width: 90px; border-radius: 4px; }
        .sk--cell-sm      { height: 14px; width: 60px; border-radius: 4px; }
        .sk--badge        { height: 22px; width: 70px; border-radius: 20px; }
        .sk--th           { height: 12px; width: 70px; border-radius: 4px; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}