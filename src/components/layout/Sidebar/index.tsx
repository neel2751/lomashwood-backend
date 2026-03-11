"use client";

import { useEffect, useState } from "react";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";

import { SidebarFooter } from "./SidebarFooter";
import { SidebarNav } from "./SidebarNav";


interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("lomash-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "72px" : "260px");
    window.localStorage.setItem("lomash-sidebar-collapsed", String(collapsed));

    return () => {
      document.documentElement.style.setProperty("--sidebar-width", "260px");
    };
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "sticky top-0 relative flex h-[100dvh] self-start flex-col border-r bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] shadow-[8px_0_32px_rgba(92,72,41,0.08)] transition-all duration-300 ease-in-out border-[var(--color-sidebar-border)]",
        collapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center overflow-hidden border-b px-5 border-[var(--color-sidebar-border)]",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-[var(--color-sidebar-accent)] to-[#7A551C] shadow-lg shadow-[rgba(167,121,43,0.22)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 13 L8 3 L14 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 9 L11.5 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="leading-none text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-sidebar-text)]">
                Lomash
              </p>
              <p className="mt-0.5 leading-none text-[10px] uppercase tracking-[0.12em] text-[var(--color-sidebar-muted)]">
                Wood Admin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--color-sidebar-border)]">
        <SidebarNav collapsed={collapsed} />
      </div>

      {/* Footer */}
      <SidebarFooter collapsed={collapsed} />

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-[52px] z-10 w-6 h-6 rounded-full",
          "border bg-[var(--color-sidebar-subtle)] text-[var(--color-sidebar-accent)] border-[var(--color-sidebar-border)]",
          "flex items-center justify-center",
          "hover:border-[var(--color-sidebar-accent)] hover:bg-[var(--color-sidebar-accent)] hover:text-white",
          "transition-all duration-200 shadow-md"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen size={12} />
        ) : (
          <PanelLeftClose size={12} />
        )}
      </button>
    </aside>
  );
}