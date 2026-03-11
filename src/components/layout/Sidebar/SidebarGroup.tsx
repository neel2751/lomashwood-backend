"use client";

import { cn } from "@/lib/utils";

import { SidebarItem } from "./SidebarItem";

import type { NavSection } from "@/types/nav.types";

interface SidebarGroupProps {
  group: NavSection;
  collapsed: boolean;
}

export function SidebarGroup({ group, collapsed }: SidebarGroupProps) {
  return (
    <div className="mb-1">
      {/* Group label */}
      {!collapsed && (
        <p
          className={cn(
            "px-3 pt-4 pb-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase",
            "select-none text-[var(--color-sidebar-muted)]"
          )}
        >
          {group.title}
        </p>
      )}

      {collapsed && (
        <div className="my-2 mx-3 h-px bg-[var(--color-sidebar-border)]" />
      )}

      {/* Items */}
      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <SidebarItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}