import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: {
    template: '%s | Lomash Wood Admin',
    default: 'Dashboard | Lomash Wood Admin',
  },
  robots: { index: false, follow: false },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <main className="dashboard-content">
          {children}
        </main>
      </div>

      <style>{`
        :root {
          --sidebar-width: 260px;
          --header-height: 64px;
          --color-bg: #F7F6F3;
          --color-surface: #FFFFFF;
          --color-sidebar-bg: #111110;
          --color-sidebar-text: #D4D0C8;
          --color-sidebar-muted: #6B6B68;
          --color-sidebar-active: #FFFFFF;
          --color-sidebar-active-bg: rgba(255,255,255,0.08);
          --color-sidebar-accent: #C9A84C;
          --color-text: #1A1A18;
          --color-muted: #6B6B68;
          --color-border: #E8E6E1;
          --color-accent: #8B6914;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
          --font-mono: 'DM Mono', monospace;
        }

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          height: 100%;
          background: var(--color-bg);
          color: var(--color-text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        .dashboard-shell {
          display: grid;
          grid-template-columns: var(--sidebar-width) 1fr;
          min-height: 100dvh;
        }

        .dashboard-main {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          overflow-x: hidden;
        }

        .dashboard-content {
          flex: 1;
          padding: 28px 32px;
        }

        @media (max-width: 1024px) {
          .dashboard-shell {
            grid-template-columns: 1fr;
          }
          .dashboard-content {
            padding: 20px 16px;
          }
        }
      `}</style>
    </div>
  )
}