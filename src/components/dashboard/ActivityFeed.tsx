"use client";

import { useState } from "react";

import {
  ShoppingCart,
  Calendar,
  User,
  Package,
  Star,
  FileText,
  RefreshCw,
  Layers,
  Bell,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ActivityType =
  | "order"
  | "appointment"
  | "customer"
  | "product"
  | "review"
  | "brochure"
  | "refund"
  | "content"
  | "notification";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "info" | "error";
  meta?: string;
  href?: string;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "order",
    title: "New Kitchen Order",
    description: "Order #LW-4821 placed for Luna White kitchen",
    timestamp: "2 min ago",
    status: "success",
    meta: "£3,499",
    href: "/orders/4821",
  },
  {
    id: "2",
    type: "appointment",
    title: "Appointment Booked",
    description: "Sarah Mitchell scheduled a home measurement for bedroom",
    timestamp: "14 min ago",
    status: "info",
    meta: "Home Visit",
    href: "/appointments/1234",
  },
  {
    id: "3",
    type: "review",
    title: "New Customer Review",
    description: "James Thornton left a 5-star review for J-Pull kitchen",
    timestamp: "38 min ago",
    status: "success",
    meta: "★ 5.0",
    href: "/customers/reviews/567",
  },
  {
    id: "4",
    type: "brochure",
    title: "Brochure Requested",
    description: "Emma Clarke requested the bedroom brochure pack",
    timestamp: "1 hr ago",
    status: "info",
    meta: "Bedroom",
    href: "/customers/support/890",
  },
  {
    id: "5",
    type: "refund",
    title: "Refund Initiated",
    description: "Refund #RF-0041 opened for Order #LW-4795",
    timestamp: "2 hr ago",
    status: "warning",
    meta: "£240",
    href: "/orders/refunds/41",
  },
  {
    id: "6",
    type: "product",
    title: "Product Updated",
    description: "Inventory updated for Pebble Grey Gloss – 3 units added",
    timestamp: "3 hr ago",
    status: "info",
    meta: "Stock",
    href: "/products/inventory/102",
  },
  {
    id: "7",
    type: "customer",
    title: "New Customer Registered",
    description: "Daniel Osei created an account via the website",
    timestamp: "4 hr ago",
    status: "success",
    meta: "New",
    href: "/customers/3310",
  },
  {
    id: "8",
    type: "content",
    title: "Blog Post Published",
    description: '"Top Kitchen Trends 2025" is now live on the site',
    timestamp: "6 hr ago",
    status: "success",
    meta: "Blog",
    href: "/content/blogs/88",
  },
  {
    id: "9",
    type: "appointment",
    title: "Showroom Appointment",
    description: "Priya Sharma booked a showroom visit – both Kitchen & Bedroom",
    timestamp: "8 hr ago",
    status: "warning",
    meta: "Dual Booking",
    href: "/appointments/1198",
  },
  {
    id: "10",
    type: "notification",
    title: "Email Campaign Sent",
    description: "Spring Sale email dispatched to 1,420 subscribers",
    timestamp: "Yesterday",
    status: "info",
    meta: "1,420 sent",
    href: "/notifications/email/55",
  },
];

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  order: {
    icon: ShoppingCart,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  appointment: {
    icon: Calendar,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  customer: {
    icon: User,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  product: {
    icon: Package,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  review: {
    icon: Star,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
  },
  brochure: {
    icon: FileText,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  refund: {
    icon: RefreshCw,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
  content: {
    icon: Layers,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
  },
  notification: {
    icon: Bell,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
  },
};

const STATUS_BADGE: Record<
  NonNullable<ActivityItem["status"]>,
  { label: string; className: string }
> = {
  success: {
    label: "Success",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  warning: {
    label: "Alert",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  info: {
    label: "Info",
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  error: {
    label: "Error",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
};

const FILTER_TABS: { label: string; value: "all" | ActivityType }[] = [
  { label: "All", value: "all" },
  { label: "Orders", value: "order" },
  { label: "Appointments", value: "appointment" },
  { label: "Customers", value: "customer" },
  { label: "Reviews", value: "review" },
];

function ActivityRow({ item }: { item: ActivityItem }) {
  const config = ACTIVITY_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div className="group relative flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer rounded-lg">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          config.bg
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">
            {item.title}
          </p>
          {item.meta && (
            <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
              {item.meta}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {item.description}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground/70">
            {item.timestamp}
          </span>
          {item.status && (
            <Badge
              variant="outline"
              className={cn(
                "h-4 px-1.5 text-[10px] font-medium border",
                STATUS_BADGE[item.status].className
              )}
            >
              {STATUS_BADGE[item.status].label}
            </Badge>
          )}
        </div>
      </div>

      <ArrowUpRight
        className="absolute right-3 top-3.5 h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-150 shrink-0"
        strokeWidth={2}
      />
    </div>
  );
}

export function ActivityFeed() {
  const [activeFilter, setActiveFilter] = useState<"all" | ActivityType>("all");

  const filtered =
    activeFilter === "all"
      ? MOCK_ACTIVITIES
      : MOCK_ACTIVITIES.filter((a) => a.type === activeFilter);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Activity Feed
          </h3>
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] font-semibold tabular-nums"
          >
            {MOCK_ACTIVITIES.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          asChild
        >
          <a href="/settings/audit-logs">
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 py-2 overflow-x-auto scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150",
              activeFilter === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.length > 0 ? (
            filtered.map((item) => <ActivityRow key={item.id} item={item} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] text-muted-foreground">
          Live updates enabled
        </span>
      </div>
    </div>
  );
}

export default ActivityFeed;