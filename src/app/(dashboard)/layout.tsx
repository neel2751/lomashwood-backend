import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TokenSyncProvider } from '@/components/auth/TokenSyncProvider'

import type { Metadata } from 'next'

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
      <TokenSyncProvider />
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}