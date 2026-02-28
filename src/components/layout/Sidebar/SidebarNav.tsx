"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  CalendarCheck,
  Users,
  FileText,
  Bell,
  ShieldCheck,
  BarChart3,
  Settings,
} from "lucide-react";
import { SidebarGroup } from "./SidebarGroup";
import type { NavGroup } from "@/types/nav.types";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: ShoppingBag,
        children: [
          { label: "All Products", href: "/products" },
          { label: "Add New", href: "/products/new" },
          { label: "Categories", href: "/products/categories" },
          { label: "Colours", href: "/products/colours" },
          { label: "Sizes & Units", href: "/products/sizes" },
          { label: "Inventory", href: "/products/inventory" },
          { label: "Pricing", href: "/products/pricing" },
        ],
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Orders",
        href: "/orders",
        icon: ClipboardList,
        badge: "12",
        children: [
          { label: "All Orders", href: "/orders" },
          { label: "Payments", href: "/orders/payments" },
          { label: "Invoices", href: "/orders/invoices" },
          { label: "Refunds", href: "/orders/refunds" },
        ],
      },
      {
        label: "Appointments",
        href: "/appointments",
        icon: CalendarCheck,
        badge: "5",
        children: [
          { label: "All Appointments", href: "/appointments" },
          { label: "Availability", href: "/appointments/availability" },
          { label: "Consultants", href: "/appointments/consultants" },
          { label: "Reminders", href: "/appointments/reminders" },
        ],
      },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        children: [
          { label: "All Customers", href: "/customers" },
          { label: "Reviews", href: "/customers/reviews" },
          { label: "Support Tickets", href: "/customers/support" },
          { label: "Loyalty", href: "/customers/loyalty" },
        ],
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Content",
        href: "/content",
        icon: FileText,
        children: [
          { label: "Blog / Inspiration", href: "/content/blogs" },
          { label: "Media Wall", href: "/content/media-wall" },
          { label: "CMS Pages", href: "/content/cms" },
          { label: "SEO", href: "/content/seo" },
          { label: "Landing Pages", href: "/content/landing-pages" },
        ],
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        children: [
          { label: "Email Logs", href: "/notifications/email" },
          { label: "SMS Logs", href: "/notifications/sms" },
          { label: "Push Logs", href: "/notifications/push" },
          { label: "Templates", href: "/notifications/templates" },
        ],
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        children: [
          { label: "Overview", href: "/analytics" },
          { label: "Tracking", href: "/analytics/tracking" },
          { label: "Funnels", href: "/analytics/funnels" },
          { label: "Dashboards", href: "/analytics/dashboards" },
          { label: "Exports", href: "/analytics/exports" },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Auth & Access",
        href: "/auth",
        icon: ShieldCheck,
        children: [
          { label: "Users", href: "/auth/users" },
          { label: "Roles", href: "/auth/roles" },
          { label: "Sessions", href: "/auth/sessions" },
        ],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        children: [
          { label: "General", href: "/settings/general" },
          { label: "Security", href: "/settings/security" },
          { label: "Integrations", href: "/settings/integrations" },
          { label: "Audit Logs", href: "/settings/audit-logs" },
        ],
      },
    ],
  },
];

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_GROUPS.map((group) => (
        <SidebarGroup key={group.label} group={group} collapsed={collapsed} />
      ))}
    </nav>
  );
}