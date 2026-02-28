"use client";

import { cn } from "@/lib/utils";

import { SidebarItem } from "./SidebarItem";

import type { NavGroup } from "@/types/nav.types";

interface SidebarGroupProps {
  group: NavGroup;
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
            "text-[#5A4232] select-none"
          )}
        >
          {group.label}
        </p>
      )}

      {collapsed && (
        <div className="my-2 mx-3 h-px bg-[#2E231A]" />
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