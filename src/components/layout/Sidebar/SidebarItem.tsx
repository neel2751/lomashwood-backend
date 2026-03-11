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
}

export function SidebarItem({ item, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const isChildActive = item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + "/")
  );
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + "/")
    : false;
  const [open, setOpen] = useState(isChildActive ?? false);

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

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
   
      {Icon && (
        <span
          className={cn(
            "shrink-0 flex items-center justify-center w-[34px] h-[34px] rounded-[8px] transition-all duration-200",
            (isActive || isChildActive)
              ? "bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-accent)]"
              : "text-[var(--color-sidebar-muted)] group-hover/item:bg-[var(--color-sidebar-hover)] group-hover/item:text-[var(--color-sidebar-accent)]"
          )}
        >
          <Icon size={17} strokeWidth={1.8} />
        </span>
      )}

     
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between min-w-0">
          <span
            className={cn(
              "text-[13px] font-medium truncate transition-colors duration-200",
              (isActive || isChildActive)
                ? "text-[var(--color-sidebar-active)]"
                : "text-[var(--color-sidebar-text)] group-hover/item:text-[var(--color-sidebar-active)]"
            )}
          >
            {item.label}
          </span>

          <span className="flex items-center gap-1.5 shrink-0 ml-2">
          
            {item.badge && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C8924A] text-[10px] font-bold text-white leading-none">
                {item.badge}
              </span>
            )}
          
            {hasChildren && (
              <ChevronRight
                size={13}
                className={cn(
                  "text-[var(--color-sidebar-muted)] transition-transform duration-200",
                  open && "rotate-90"
                )}
              />
            )}
          </span>
        </span>
      )}

     
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
       
        {(hasChildren && !collapsed) || !item.href ? (
          <button
            onClick={handleClick}
            className={cn(
              "w-full flex items-center gap-2 px-1.5 py-1 rounded-[10px] transition-all duration-150",
              "relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-sidebar-accent)]/30",
              (isActive || isChildActive) ? "bg-[var(--color-sidebar-active-bg)]" : "hover:bg-[var(--color-sidebar-hover)]"
            )}
          >
            {itemContent}
           
            {(isActive || isChildActive) && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-sidebar-accent)]" />
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-1.5 py-1 rounded-[10px] transition-all duration-150",
              "relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-sidebar-accent)]/30",
              collapsed ? "justify-center px-0 w-full" : "",
              isActive || isChildActive ? "bg-[var(--color-sidebar-active-bg)]" : "hover:bg-[var(--color-sidebar-hover)]"
            )}
          >
            {itemContent}
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-sidebar-accent)]" />
            )}
          </Link>
        )}

        {collapsed && showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="rounded-[8px] border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-subtle)] px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-[var(--color-sidebar-text)] shadow-xl">
              {item.label}
              {item.badge && (
                <span className="ml-2 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--color-sidebar-accent)] px-1 text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              )}
              
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--color-sidebar-border)]" />
            </div>
          </div>
        )}
      </div>

      
      {hasChildren && !collapsed && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l py-0.5 pl-3 border-[var(--color-sidebar-border)]">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-[7px] rounded-[8px] text-[12.5px] transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-sidebar-accent)]/30",
                  pathname === child.href
                    ? "bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active)] font-medium"
                    : "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-accent)]"
                )}
              >
              
                <span
                  className={cn(
                    "w-1 h-1 rounded-full shrink-0 transition-colors",
                    pathname === child.href ? "bg-[var(--color-sidebar-accent)]" : "bg-[var(--color-sidebar-border)]"
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