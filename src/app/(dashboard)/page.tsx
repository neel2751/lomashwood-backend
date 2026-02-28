import type { Metadata } from 'next'
import { Suspense } from 'react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrdersChart } from '@/components/dashboard/OrdersChart'
import { AppointmentsChart } from '@/components/dashboard/AppointmentsChart'
import { TopProducts } from '@/components/dashboard/TopProducts'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { RecentCustomers } from '@/components/dashboard/RecentCustomers'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Overview',
}

const stats = [
  {
    label: 'Total Revenue',
    value: '£284,320',
    delta: '+12.4%',
    trend: 'up' as const,
    period: 'vs last month',
    icon: 'revenue',
  },
  {
    label: 'Orders',
    value: '1,284',
    delta: '+8.1%',
    trend: 'up' as const,
    period: 'vs last month',
    icon: 'orders',
  },
  {
    label: 'Appointments',
    value: '342',
    delta: '-3.2%',
    trend: 'down' as const,
    period: 'vs last month',
    icon: 'appointments',
  },
  {
    label: 'New Customers',
    value: '891',
    delta: '+18.7%',
    trend: 'up' as const,
    period: 'vs last month',
    icon: 'customers',
  },
]

export default function DashboardOverviewPage() {
  return (
    <div className="overview">
      <PageHeader
        title="Overview"
        description="Welcome back. Here's what's happening at Lomash Wood."
      />

      <section className="overview__stats">
        {stats.map((stat) => (
          <Suspense key={stat.label} fallback={<div className="stat-skeleton" />}>
            <StatsCard {...stat} />
          </Suspense>
        ))}
      </section>

      <section className="overview__charts">
        <div className="overview__charts-main">
          <Suspense fallback={<div className="chart-skeleton" />}>
            <RevenueChart />
          </Suspense>
          <Suspense fallback={<div className="chart-skeleton" />}>
            <OrdersChart />
          </Suspense>
        </div>
        <div className="overview__charts-side">
          <Suspense fallback={<div className="chart-skeleton" />}>
            <AppointmentsChart />
          </Suspense>
          <Suspense fallback={<div className="chart-skeleton" />}>
            <TopProducts />
          </Suspense>
        </div>
      </section>

      <section className="overview__tables">
        <Suspense fallback={<div className="table-skeleton" />}>
          <RecentOrders />
        </Suspense>
        <Suspense fallback={<div className="table-skeleton" />}>
          <RecentCustomers />
        </Suspense>
        <Suspense fallback={<div className="feed-skeleton" />}>
          <ActivityFeed />
        </Suspense>
      </section>

      <style>{`
        .overview {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .overview__stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 1280px) {
          .overview__stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .overview__stats {
            grid-template-columns: 1fr;
          }
        }

        .overview__charts {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
        }

        @media (max-width: 1280px) {
          .overview__charts {
            grid-template-columns: 1fr;
          }
        }

        .overview__charts-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .overview__charts-side {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .overview__tables {
          display: grid;
          grid-template-columns: 1fr 1fr 320px;
          gap: 16px;
        }

        @media (max-width: 1280px) {
          .overview__tables {
            grid-template-columns: 1fr;
          }
        }

        .stat-skeleton,
        .chart-skeleton,
        .table-skeleton,
        .feed-skeleton {
          border-radius: 12px;
          background: linear-gradient(90deg, #EEECE8 25%, #F5F3EF 50%, #EEECE8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .stat-skeleton { height: 120px; }
        .chart-skeleton { height: 280px; }
        .table-skeleton { height: 360px; }
        .feed-skeleton { height: 360px; }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}