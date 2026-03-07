import { Suspense } from 'react'

import { PoundSterling, ShoppingCart, CalendarCheck, Users } from 'lucide-react'

import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { AppointmentsChart } from '@/components/dashboard/AppointmentsChart'
import { OrdersChart } from '@/components/dashboard/OrdersChart'
import { RecentCustomers } from '@/components/dashboard/RecentCustomers'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { TopProducts } from '@/components/dashboard/TopProducts'
import { PageHeader } from '@/components/layout/PageHeader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Overview',
}

const stats = [
  {
    title: 'Total Revenue',
    value: '284,320',
    prefix: '£',
    change: 12.4,
    changeLabel: 'vs last month',
    icon: PoundSterling,
    iconColor: 'text-[#C8924A]',
    iconBg: 'bg-[#C8924A]/15',
  },
  {
    title: 'Orders',
    value: '1,284',
    change: 8.1,
    changeLabel: 'vs last month',
    icon: ShoppingCart,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10',
  },
  {
    title: 'Appointments',
    value: '342',
    change: -3.2,
    changeLabel: 'vs last month',
    icon: CalendarCheck,
    iconColor: 'text-[#6B8A9A]',
    iconBg: 'bg-[#6B8A9A]/15',
  },
  {
    title: 'New Customers',
    value: '891',
    change: 18.7,
    changeLabel: 'vs last month',
    icon: Users,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-400/10',
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
          <Suspense key={stat.title} fallback={<div className="stat-skeleton" />}>
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

export const dynamic = 'force-dynamic'
