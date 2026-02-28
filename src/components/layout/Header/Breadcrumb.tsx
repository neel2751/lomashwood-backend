"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

const LABEL_MAP: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  colours: "Colours",
  sizes: "Sizes & Units",
  inventory: "Inventory",
  pricing: "Pricing",
  orders: "Orders",
  payments: "Payments",
  invoices: "Invoices",
  refunds: "Refunds",
  appointments: "Appointments",
  availability: "Availability",
  consultants: "Consultants",
  reminders: "Reminders",
  customers: "Customers",
  reviews: "Reviews",
  support: "Support Tickets",
  loyalty: "Loyalty",
  content: "Content",
  blogs: "Blog / Inspiration",
  "media-wall": "Media Wall",
  cms: "CMS Pages",
  seo: "SEO",
  "landing-pages": "Landing Pages",
  notifications: "Notifications",
  email: "Email Logs",
  sms: "SMS Logs",
  push: "Push Logs",
  templates: "Templates",
  analytics: "Analytics",
  tracking: "Tracking",
  funnels: "Funnels",
  dashboards: "Dashboards",
  exports: "Exports",
  auth: "Auth & Access",
  users: "Users",
  roles: "Roles",
  sessions: "Sessions",
  settings: "Settings",
  general: "General",
  security: "Security",
  integrations: "Integrations",
  "audit-logs": "Audit Logs",
  new: "New",
};

function getLabel(segment: string): string {
  return LABEL_MAP[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  // Build crumb list: home + each segment
  const crumbs = segments.map((seg, i) => ({
    label: getLabel(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
    isDynamic: seg.startsWith("[") || /^[0-9a-f-]{8,}$/i.test(seg), // treat UUIDs as dynamic
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0">
      {/* Home */}
      <Link
        href="/"
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-[7px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
        aria-label="Dashboard"
      >
        <Home size={14} />
      </Link>

      {crumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1 min-w-0">
          <ChevronRight size={13} className="shrink-0 text-[#3D2E1E]" />

          {crumb.isLast ? (
            <span
              className={cn(
                "text-[13px] font-medium truncate",
                crumb.isDynamic ? "text-[#7A6045] italic" : "text-[#E8D5B7]"
              )}
            >
              {crumb.isDynamic ? "Detail" : crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-[13px] text-[#7A6045] hover:text-[#C8924A] transition-colors truncate"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}