import type { LucideIcon } from "lucide-react";

export type NavItemBase = {
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  permission?: string;
};

export type NavLeaf = NavItemBase & {
  href: string;
  children?: never;
};

export type NavGroup = NavItemBase & {
  href?: string;
  children: NavLeaf[];
};

export type NavItem = NavLeaf | NavGroup;

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

export type SidebarState = {
  isCollapsed: boolean;
  activeItem: string | null;
  expandedGroups: string[];
};