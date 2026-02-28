"use client";

import { useState, useRef, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { NavItem } from "@/types/nav.types";

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
}

export function SidebarItem({ item, collapsed, depth = 0 }: SidebarItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  // Auto-expand if a child is active
  const isChildActive = item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + "/")
  );
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const [open, setOpen] = useState(isChildActive ?? false);

  // Tooltip positioning for collapsed state
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Sync open state when route changes
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  const handleClick = () => {
    if (hasChildren && !collapsed) {
      setOpen(!open);
    }
  };

  const itemContent = (
    <>
      {/* Icon */}
      {Icon && (
        <span
          className={cn(
            "shrink-0 flex items-center justify-center w-[34px] h-[34px] rounded-[8px] transition-all duration-200",
            (isActive || isChildActive)
              ? "bg-[#C8924A]/15 text-[#C8924A]"
              : "text-[#7A6045] group-hover/item:text-[#C8924A] group-hover/item:bg-[#2E231A]"
          )}
        >
          <Icon size={17} strokeWidth={1.8} />
        </span>
      )}

      {/* Label + badge */}
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between min-w-0">
          <span
            className={cn(
              "text-[13px] font-medium truncate transition-colors duration-200",
              (isActive || isChildActive) ? "text-[#E8D5B7]" : "text-[#9A7A5A] group-hover/item:text-[#C8924A]"
            )}
          >
            {item.label}
          </span>

          <span className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Badge */}
            {item.badge && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C8924A] text-[10px] font-bold text-white leading-none">
                {item.badge}
              </span>
            )}
            {/* Chevron */}
            {hasChildren && (
              <ChevronRight
                size={13}
                className={cn(
                  "text-[#5A4232] transition-transform duration-200",
                  open && "rotate-90"
                )}
              />
            )}
          </span>
        </span>
      )}

      {/* Collapsed badge dot */}
      {collapsed && item.badge && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C8924A]" />
      )}
    </>
  );

  return (
    <div>
      <div
        className="relative group/item"
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Main row */}
        {hasChildren && !collapsed ? (
          <button
            onClick={handleClick}
            className={cn(
              "w-full flex items-center gap-2 px-1.5 py-1 rounded-[10px] transition-all duration-150",
              "relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8924A]/40",
              (isActive || isChildActive) ? "bg-[#2E231A]" : "hover:bg-[#221A12]"
            )}
          >
            {itemContent}
            {/* Active indicator bar */}
            {(isActive || isChildActive) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#C8924A]" />
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={hasChildren ? handleClick : undefined}
            className={cn(
              "flex items-center gap-2 px-1.5 py-1 rounded-[10px] transition-all duration-150",
              "relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8924A]/40",
              collapsed ? "justify-center px-0 w-full" : "",
              isActive ? "bg-[#2E231A]" : "hover:bg-[#221A12]"
            )}
          >
            {itemContent}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#C8924A]" />
            )}
          </Link>
        )}

        {/* Tooltip for collapsed mode */}
        {collapsed && showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-[#2E231A] border border-[#3D2E1E] text-[#E8D5B7] text-[12px] font-medium px-3 py-1.5 rounded-[8px] whitespace-nowrap shadow-xl">
              {item.label}
              {item.badge && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-[#C8924A] text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              )}
              {/* Arrow */}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#3D2E1E]" />
            </div>
          </div>
        )}
      </div>

      {/* Sub-items accordion */}
      {hasChildren && !collapsed && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="mt-0.5 ml-4 pl-3 border-l border-[#2E231A] flex flex-col gap-0.5 py-0.5">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-[7px] rounded-[8px] text-[12.5px] transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8924A]/40",
                  pathname === child.href
                    ? "bg-[#C8924A]/10 text-[#E8D5B7] font-medium"
                    : "text-[#7A6045] hover:text-[#C8924A] hover:bg-[#221A12]"
                )}
              >
                {/* Dot indicator */}
                <span
                  className={cn(
                    "w-1 h-1 rounded-full shrink-0 transition-colors",
                    pathname === child.href ? "bg-[#C8924A]" : "bg-[#3D2E1E]"
                  )}
                />
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}