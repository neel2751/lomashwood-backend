"use client";

import { useState, useRef, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  User,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const MENU_ITEMS = [
  {
    group: "Account",
    items: [
      { label: "My Profile", href: "/auth/users/me", icon: User },
      { label: "Settings", href: "/settings/general", icon: Settings },
    ],
  },
  {
    group: "Access",
    items: [
      { label: "Roles & Permissions", href: "/auth/roles", icon: ShieldCheck },
    ],
  },
];

export function AdminUserMenu() {
  const router = useRouter();
  const { user, clearUser  } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "LW";

  const handleLogout = async () => {
    setOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearUser();
      router.push("/login");
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 h-9 pl-1 pr-2.5 rounded-[10px] transition-all",
          "hover:bg-[var(--color-header-hover)]",
          open && "bg-[var(--color-header-hover)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-sidebar-accent)]/30"
        )}
        aria-label="User menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="relative">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-sidebar-accent)] to-[#7A551C] text-[11px] font-semibold text-white shadow-md shadow-[rgba(167,121,43,0.2)]">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[var(--color-header-bg)] bg-emerald-500" />
        </div>

        {/* Name */}
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[12.5px] font-medium leading-none text-[var(--color-header-text)]">
            {user?.name ?? "Admin"}
          </span>
          <span className="mt-0.5 text-[10px] capitalize leading-none text-[var(--color-header-muted)]">
            {user?.roleName ?? "administrator"}
          </span>
        </div>

        <ChevronDown
          size={13}
          className={cn(
            "hidden text-[var(--color-header-muted)] transition-transform duration-200 sm:block",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] overflow-hidden rounded-[14px] border border-[var(--color-header-border)] bg-[var(--color-header-panel)] shadow-2xl shadow-[rgba(92,72,41,0.18)]">
          {/* User info header */}
          <div className="border-b border-[var(--color-header-border)] px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-[var(--color-header-text)]">
              {user?.name ?? "Admin User"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--color-header-muted)]">
              {user?.email ?? "admin@lomashwood.co.uk"}
            </p>
          </div>

          {/* Menu groups */}
          {MENU_ITEMS.map((group) => (
            <div key={group.group} className="border-b border-[var(--color-header-border)] py-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9A8B7C]">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[12.5px] text-[var(--color-header-muted)] transition-all hover:bg-[var(--color-header-hover)] hover:text-[var(--color-sidebar-accent)]"
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-[12.5px] text-[var(--color-header-muted)] transition-all hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}