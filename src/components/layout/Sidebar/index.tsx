"use client";

import { useState } from "react";
import { SidebarNav } from "./SidebarNav";
import { SidebarFooter } from "./SidebarFooter";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-[#1C1611] border-r border-[#2E231A] transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center h-[72px] px-5 border-b border-[#2E231A] shrink-0 overflow-hidden",
          collapsed && "justify-center px-0"
        )}
      >
        {/* Wood grain accent bar */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-[6px] bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] flex items-center justify-center shadow-lg shadow-[#C8924A]/20">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 13 L8 3 L14 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 9 L11.5 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#E8D5B7] leading-none">
                Lomash
              </p>
              <p className="text-[10px] tracking-[0.12em] uppercase text-[#7A6045] leading-none mt-0.5">
                Wood Admin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2E231A]">
        <SidebarNav collapsed={collapsed} />
      </div>

      {/* Footer */}
      <SidebarFooter collapsed={collapsed} />

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-[52px] z-10 w-6 h-6 rounded-full",
          "bg-[#2E231A] border border-[#3D2E1E] text-[#C8924A]",
          "flex items-center justify-center",
          "hover:bg-[#C8924A] hover:text-white hover:border-[#C8924A]",
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