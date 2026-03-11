"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  CalendarCheck,
  Store,
  Users,
  FileText,
  Bell,
  ShieldCheck,
  BarChart3,
  Settings,
} from "lucide-react";

import { SidebarGroup } from "./SidebarGroup";

import type { NavSection } from "@/types/nav.types";

const NAV_GROUPS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Catalogue",
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
    title: "Sales",
    items: [
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
      {
        label: "Showrooms",
        href: "/showrooms",
        icon: Store,
        children: [
          { label: "All Showrooms", href: "/showrooms" },
          { label: "Add New", href: "/showrooms/new" },
        ],
      },
    ],
  },
  {
    title: "Customers",
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
    title: "Content",
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
    title: "Analytics",
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
    title: "System",
    items: [
      {
        label: "Auth & Access",
        href: "/auth",
        icon: ShieldCheck,
        children: [
          { label: "Users", href: "/auth/users" },
          { label: "Register New", href: "/auth/register" },
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
        <SidebarGroup key={group.title} group={group} collapsed={collapsed} />
      ))}
    </nav>
  );
}