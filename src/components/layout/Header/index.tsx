"use client";

import { AdminUserMenu } from "./AdminUserMenu";
import { Breadcrumb } from "./Breadcrumb";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-[var(--color-header-border)] bg-[var(--color-header-bg)] px-6 backdrop-blur-sm shadow-[0_8px_24px_rgba(107,85,53,0.06)]">
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