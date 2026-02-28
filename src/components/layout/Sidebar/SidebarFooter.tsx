"use client";

import { useState } from "react";

import Link from "next/link";

import { LogOut, HelpCircle, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { user, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);

  // Derived initials from user name
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "LW";

  return (
    <div className="shrink-0 border-t border-[#2E231A]">
      {/* Quick actions row */}
      {!collapsed && (
        <div className="flex items-center gap-1 px-3 py-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-[8px] transition-all",
              "text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A]"
            )}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-[8px] transition-all",
              "text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A]"
            )}
            aria-label="Help & docs"
          >
            <HelpCircle size={15} />
          </Link>

          <button
            onClick={logout}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-[8px] transition-all ml-auto",
              "text-[#5A4232] hover:text-red-400 hover:bg-red-500/10"
            )}
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}

      {/* User profile row */}
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-3",
          collapsed && "justify-center px-0 py-3"
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              "bg-gradient-to-br from-[#C8924A] to-[#8B5E2A]",
              "text-white font-semibold text-[12px] tracking-wide",
              "shadow-md shadow-[#C8924A]/20",
              collapsed ? "w-9 h-9" : "w-8 h-8"
            )}
          >
            {initials}
          </div>
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#1C1611]" />
        </div>

        {/* Name + role */}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#E8D5B7] truncate leading-none">
              {user?.name ?? "Admin User"}
            </p>
            <p className="text-[11px] text-[#5A4232] truncate leading-none mt-0.5 capitalize">
              {user?.role ?? "administrator"}
            </p>
          </div>
        )}

        {/* Collapsed logout shortcut */}
        {collapsed && (
          <button
            onClick={logout}
            className="sr-only"
            aria-label="Sign out"
          />
        )}
      </div>
    </div>
  );
}