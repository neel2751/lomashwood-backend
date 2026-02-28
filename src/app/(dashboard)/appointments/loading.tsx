export default function AppointmentsLoading() {
  return (
    <div className="appts-loading">
      <div className="al-topbar">
        <div className="al-title-group">
          <div className="sk sk--title" />
          <div className="sk sk--subtitle" />
        </div>
        <div className="sk sk--btn" />
      </div>

      <div className="al-subnav">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk sk--tab" />
        ))}
      </div>

      <div className="al-stats">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="sk sk--stat" />
        ))}
      </div>

      <div className="al-body">
        <div className="al-table-col">
          <div className="al-filters">
            <div className="sk sk--search" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sk sk--select" />
            ))}
          </div>
          <div className="al-table">
            <div className="sk sk--table-head" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="sk sk--table-row" />
            ))}
          </div>
        </div>
        <div className="al-calendar-col">
          <div className="sk sk--section-label" />
          <div className="sk sk--calendar" />
        </div>
      </div>

      <style>{`
        .appts-loading { display: flex; flex-direction: column; gap: 24px; }

        .al-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .al-title-group { display: flex; flex-direction: column; gap: 8px; }

        .al-subnav { display: flex; gap: 4px; border-bottom: 1.5px solid #E8E6E1; padding-bottom: 0; }

        .al-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
        @media (max-width: 1200px) { .al-stats { grid-template-columns: repeat(3, 1fr); } }

        .al-body { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
        @media (max-width: 1100px) { .al-body { grid-template-columns: 1fr; } }

        .al-table-col { display: flex; flex-direction: column; gap: 14px; }
        .al-filters { display: flex; gap: 8px; flex-wrap: wrap; }

        .al-table { display: flex; flex-direction: column; gap: 1px; border-radius: 12px; overflow: hidden; border: 1.5px solid #E8E6E1; }

        .sk {
          border-radius: 8px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .sk--title    { height: 32px; width: 200px; }
        .sk--subtitle { height: 18px; width: 380px; border-radius: 4px; }
        .sk--btn      { height: 38px; width: 100px; }
        .sk--tab      { height: 36px; width: 110px; border-radius: 4px; }
        .sk--stat     { height: 78px; border-radius: 12px; }
        .sk--search   { height: 38px; width: 200px; }
        .sk--select   { height: 38px; width: 110px; }
        .sk--section-label { height: 14px; width: 80px; border-radius: 4px; margin-bottom: 12px; }
        .sk--calendar { height: 340px; border-radius: 12px; }
        .sk--table-head { height: 42px; border-radius: 0; background: #FAFAF8; border-bottom: 1.5px solid #E8E6E1; }
        .sk--table-row  { height: 58px; border-radius: 0; border-bottom: 1px solid #F5F3EF; }

        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}