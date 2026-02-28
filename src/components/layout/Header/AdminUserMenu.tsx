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
  const { user, logout } = useAuthStore();
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
    logout();
    router.push("/login");
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
          "hover:bg-[#2E231A]",
          open && "bg-[#2E231A]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8924A]/40"
        )}
        aria-label="User menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="relative">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#C8924A] to-[#8B5E2A] text-white text-[11px] font-semibold shadow-md shadow-[#C8924A]/20">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-[#1C1611]" />
        </div>

        {/* Name */}
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[12.5px] font-medium text-[#E8D5B7] leading-none">
            {user?.name ?? "Admin"}
          </span>
          <span className="text-[10px] text-[#5A4232] leading-none mt-0.5 capitalize">
            {user?.role ?? "administrator"}
          </span>
        </div>

        <ChevronDown
          size={13}
          className={cn(
            "text-[#5A4232] transition-transform duration-200 hidden sm:block",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-[#1C1611] border border-[#2E231A] rounded-[14px] shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-[#2E231A]">
            <p className="text-[13px] font-semibold text-[#E8D5B7] truncate">
              {user?.name ?? "Admin User"}
            </p>
            <p className="text-[11px] text-[#5A4232] truncate mt-0.5">
              {user?.email ?? "admin@lomashwood.co.uk"}
            </p>
          </div>

          {/* Menu groups */}
          {MENU_ITEMS.map((group) => (
            <div key={group.group} className="py-1 border-b border-[#2E231A]">
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3D2E1E]">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all"
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
              className="w-full flex items-center gap-3 px-4 py-2 text-[12.5px] text-[#7A6045] hover:text-red-400 hover:bg-red-500/10 transition-all"
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