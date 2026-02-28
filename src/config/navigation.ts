import {
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingCart,
  CalendarDays,
  Users,
  FileText,
  Bell,
  ShieldCheck,
  Settings,
  TrendingUp,
  GitMerge,
  MonitorDot,
  Download,
  Tag,
  Palette,
  Ruler,
  Boxes,
  DollarSign,
  CreditCard,
  Receipt,
  RefreshCcw,
  CalendarClock,
  UserCog,
  AlarmClock,
  Star,
  LifeBuoy,
  Gift,
  FileEdit,
  Image,
  Globe,
  Megaphone,
  Mail,
  MessageSquare,
  Smartphone,
  LayoutTemplate,
  User,
  Lock,
  Key,
  Activity,
  Sliders,
  Plug,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PERMISSIONS } from "@/lib/constants";
import type { PermissionKey } from "@/lib/constants";

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  permission?: PermissionKey;
  badge?: string;
  exact?: boolean;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  href: string;
  permission?: PermissionKey;
  children?: NavItem[];
};

export type NavSection = {
  title?: string;
  items: (NavItem | NavGroup)[];
};

export function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return "children" in item && Array.isArray((item as NavGroup).children);
}

export const navigationConfig: NavSection[] = [
  {
    items: [
      {
        label: "Overview",
        href: "/",
        icon: LayoutDashboard,
        exact: true,
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
        permission: PERMISSIONS.ANALYTICS_VIEW,
        children: [
          {
            label: "Overview",
            href: "/analytics",
            icon: TrendingUp,
            permission: PERMISSIONS.ANALYTICS_VIEW,
            exact: true,
          },
          {
            label: "Tracking",
            href: "/analytics/tracking",
            icon: Activity,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            label: "Funnels",
            href: "/analytics/funnels",
            icon: GitMerge,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            label: "Dashboards",
            href: "/analytics/dashboards",
            icon: MonitorDot,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            label: "Exports",
            href: "/analytics/exports",
            icon: Download,
            permission: PERMISSIONS.ANALYTICS_EXPORT,
          },
        ],
      },
    ],
  },

  {
    title: "Catalogue",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
        permission: PERMISSIONS.PRODUCTS_VIEW,
        children: [
          {
            label: "All Products",
            href: "/products",
            icon: Package,
            permission: PERMISSIONS.PRODUCTS_VIEW,
            exact: true,
          },
          {
            label: "Categories",
            href: "/products/categories",
            icon: Tag,
            permission: PERMISSIONS.PRODUCTS_VIEW,
          },
          {
            label: "Colours",
            href: "/products/colours",
            icon: Palette,
            permission: PERMISSIONS.PRODUCTS_VIEW,
          },
          {
            label: "Sizes & Units",
            href: "/products/sizes",
            icon: Ruler,
            permission: PERMISSIONS.PRODUCTS_VIEW,
          },
          {
            label: "Inventory",
            href: "/products/inventory",
            icon: Boxes,
            permission: PERMISSIONS.PRODUCTS_VIEW,
          },
          {
            label: "Pricing",
            href: "/products/pricing",
            icon: DollarSign,
            permission: PERMISSIONS.PRODUCTS_VIEW,
          },
        ],
      },
    ],
  },

  {
    title: "Sales",
    items: [
      {
        label: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        permission: PERMISSIONS.ORDERS_VIEW,
        children: [
          {
            label: "All Orders",
            href: "/orders",
            icon: ShoppingCart,
            permission: PERMISSIONS.ORDERS_VIEW,
            exact: true,
          },
          {
            label: "Payments",
            href: "/orders/payments",
            icon: CreditCard,
            permission: PERMISSIONS.ORDERS_VIEW,
          },
          {
            label: "Invoices",
            href: "/orders/invoices",
            icon: Receipt,
            permission: PERMISSIONS.ORDERS_VIEW,
          },
          {
            label: "Refunds",
            href: "/orders/refunds",
            icon: RefreshCcw,
            permission: PERMISSIONS.ORDERS_UPDATE,
          },
        ],
      },
    ],
  },

  {
    title: "Appointments",
    items: [
      {
        label: "Appointments",
        href: "/appointments",
        icon: CalendarDays,
        permission: PERMISSIONS.APPOINTMENTS_VIEW,
        children: [
          {
            label: "All Appointments",
            href: "/appointments",
            icon: CalendarDays,
            permission: PERMISSIONS.APPOINTMENTS_VIEW,
            exact: true,
          },
          {
            label: "Availability",
            href: "/appointments/availability",
            icon: CalendarClock,
            permission: PERMISSIONS.APPOINTMENTS_UPDATE,
          },
          {
            label: "Consultants",
            href: "/appointments/consultants",
            icon: UserCog,
            permission: PERMISSIONS.APPOINTMENTS_VIEW,
          },
          {
            label: "Reminders",
            href: "/appointments/reminders",
            icon: AlarmClock,
            permission: PERMISSIONS.APPOINTMENTS_VIEW,
          },
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
        permission: PERMISSIONS.CUSTOMERS_VIEW,
        children: [
          {
            label: "All Customers",
            href: "/customers",
            icon: Users,
            permission: PERMISSIONS.CUSTOMERS_VIEW,
            exact: true,
          },
          {
            label: "Reviews",
            href: "/customers/reviews",
            icon: Star,
            permission: PERMISSIONS.CUSTOMERS_VIEW,
          },
          {
            label: "Support",
            href: "/customers/support",
            icon: LifeBuoy,
            permission: PERMISSIONS.CUSTOMERS_VIEW,
          },
          {
            label: "Loyalty",
            href: "/customers/loyalty",
            icon: Gift,
            permission: PERMISSIONS.CUSTOMERS_VIEW,
          },
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
        permission: PERMISSIONS.CONTENT_VIEW,
        children: [
          {
            label: "Blog",
            href: "/content/blogs",
            icon: FileEdit,
            permission: PERMISSIONS.CONTENT_VIEW,
          },
          {
            label: "Media Wall",
            href: "/content/media-wall",
            icon: Image,
            permission: PERMISSIONS.CONTENT_VIEW,
          },
          {
            label: "CMS Pages",
            href: "/content/cms",
            icon: Globe,
            permission: PERMISSIONS.CONTENT_VIEW,
          },
          {
            label: "SEO",
            href: "/content/seo",
            icon: TrendingUp,
            permission: PERMISSIONS.CONTENT_VIEW,
          },
          {
            label: "Landing Pages",
            href: "/content/landing-pages",
            icon: Megaphone,
            permission: PERMISSIONS.CONTENT_VIEW,
          },
        ],
      },
    ],
  },

  {
    title: "Notifications",
    items: [
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        permission: PERMISSIONS.SETTINGS_VIEW,
        children: [
          {
            label: "Email Logs",
            href: "/notifications/email",
            icon: Mail,
            permission: PERMISSIONS.SETTINGS_VIEW,
          },
          {
            label: "SMS Logs",
            href: "/notifications/sms",
            icon: MessageSquare,
            permission: PERMISSIONS.SETTINGS_VIEW,
          },
          {
            label: "Push Logs",
            href: "/notifications/push",
            icon: Smartphone,
            permission: PERMISSIONS.SETTINGS_VIEW,
          },
          {
            label: "Templates",
            href: "/notifications/templates",
            icon: LayoutTemplate,
            permission: PERMISSIONS.SETTINGS_VIEW,
          },
        ],
      },
    ],
  },

  {
    title: "Administration",
    items: [
      {
        label: "Auth & Access",
        href: "/auth",
        icon: ShieldCheck,
        permission: PERMISSIONS.USERS_VIEW,
        children: [
          {
            label: "Users",
            href: "/auth/users",
            icon: User,
            permission: PERMISSIONS.USERS_VIEW,
          },
          {
            label: "Roles",
            href: "/auth/roles",
            icon: Key,
            permission: PERMISSIONS.ROLES_MANAGE,
          },
          {
            label: "Sessions",
            href: "/auth/sessions",
            icon: Lock,
            permission: PERMISSIONS.USERS_MANAGE,
          },
        ],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_VIEW,
        children: [
          {
            label: "General",
            href: "/settings/general",
            icon: Sliders,
            permission: PERMISSIONS.SETTINGS_VIEW,
          },
          {
            label: "Security",
            href: "/settings/security",
            icon: Lock,
            permission: PERMISSIONS.SETTINGS_MANAGE,
          },
          {
            label: "Integrations",
            href: "/settings/integrations",
            icon: Plug,
            permission: PERMISSIONS.SETTINGS_MANAGE,
          },
          {
            label: "Audit Logs",
            href: "/settings/audit-logs",
            icon: ClipboardList,
            permission: PERMISSIONS.SETTINGS_VIEW,
          },
        ],
      },
    ],
  },
];

export const quickNavItems: NavItem[] = [
  {
    label: "New Product",
    href: "/products/new",
    icon: Package,
    permission: PERMISSIONS.PRODUCTS_CREATE,
  },
  {
    label: "New Blog Post",
    href: "/content/blogs/new",
    icon: FileEdit,
    permission: PERMISSIONS.CONTENT_CREATE,
  },
  {
    label: "New Consultant",
    href: "/appointments/consultants/new",
    icon: UserCog,
    permission: PERMISSIONS.APPOINTMENTS_UPDATE,
  },
  {
    label: "New User",
    href: "/auth/users/new",
    icon: User,
    permission: PERMISSIONS.USERS_MANAGE,
  },
];

export function flattenNavItems(sections: NavSection[]): NavItem[] {
  const result: NavItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (isNavGroup(item)) {
        result.push({ label: item.label, href: item.href, icon: item.icon });
        if (item.children) result.push(...item.children);
      } else {
        result.push(item);
      }
    }
  }
  return result;
}