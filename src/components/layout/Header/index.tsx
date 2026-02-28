"use client";

import { Breadcrumb } from "./Breadcrumb";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { AdminUserMenu } from "./AdminUserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center h-[72px] px-6 gap-4 bg-[#1C1611]/95 backdrop-blur-sm border-b border-[#2E231A]">
      {/* Left: Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <GlobalSearch />
        <NotificationBell />
        <AdminUserMenu />
      </div>
    </header>
  );
}