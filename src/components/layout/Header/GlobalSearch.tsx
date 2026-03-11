"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import { Search, X, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "Products", href: "/products", group: "Catalogue" },
  { label: "Add New Product", href: "/products/new", group: "Catalogue" },
  { label: "Categories", href: "/products/categories", group: "Catalogue" },
  { label: "Colours", href: "/products/colours", group: "Catalogue" },
  { label: "Orders", href: "/orders", group: "Sales" },
  { label: "Refunds", href: "/orders/refunds", group: "Sales" },
  { label: "Appointments", href: "/appointments", group: "Sales" },
  { label: "Consultants", href: "/appointments/consultants", group: "Sales" },
  { label: "Customers", href: "/customers", group: "Customers" },
  { label: "Reviews", href: "/customers/reviews", group: "Customers" },
  { label: "Support Tickets", href: "/customers/support", group: "Customers" },
  { label: "Blog / Inspiration", href: "/content/blogs", group: "Content" },
  { label: "Media Wall", href: "/content/media-wall", group: "Content" },
  { label: "Analytics", href: "/analytics", group: "Analytics" },
  { label: "Users", href: "/auth/users", group: "System" },
  { label: "Settings", href: "/settings", group: "System" },
  { label: "Audit Logs", href: "/settings/audit-logs", group: "System" },
];

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? QUICK_LINKS.filter((l) =>
        l.label.toLowerCase().includes(query.toLowerCase()) ||
        l.group.toLowerCase().includes(query.toLowerCase())
      )
    : QUICK_LINKS.slice(0, 8);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const navigate = (href: string) => {
    router.push(href);
    close();
  };

  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  return (
    <>
    
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-[10px]",
          "border border-[var(--color-header-border)] bg-[var(--color-header-panel)] text-[var(--color-header-muted)]",
          "hover:border-[var(--color-sidebar-accent)]/40 hover:text-[var(--color-sidebar-accent)] transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-sidebar-accent)]/30"
        )}
        aria-label="Open search"
      >
        <Search size={14} />
        <span className="text-[12px] hidden sm:block">Search...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 rounded-[5px] border border-[var(--color-header-border)] bg-[#F7F0E5] px-1.5 py-0.5 text-[10px] font-mono leading-none text-[var(--color-header-muted)]">
          ⌘K
        </kbd>
      </button>

    
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={close}
        >
         
          <div className="absolute inset-0 bg-[rgba(35,27,18,0.35)] backdrop-blur-sm" />

          
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-[14px] border border-[var(--color-header-border)] bg-[var(--color-header-panel)] shadow-2xl shadow-[rgba(92,72,41,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
           
            <div className="flex items-center gap-3 border-b border-[var(--color-header-border)] px-4 py-3">
              <Search size={16} className="shrink-0 text-[var(--color-sidebar-accent)]" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, products, orders..."
                className="flex-1 bg-transparent text-[14px] text-[var(--color-header-text)] placeholder:text-[var(--color-header-muted)] focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[var(--color-header-muted)] hover:text-[var(--color-sidebar-accent)]">
                  <X size={14} />
                </button>
              )}
            </div>

          
            <div className="max-h-[340px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[var(--color-header-muted)]">No results found.</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className="group flex w-full items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--color-header-hover)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 rounded-full bg-[#F3E7D3] px-2 py-0.5 text-[10px] text-[var(--color-header-muted)] transition-colors group-hover:bg-[#E8D7BA]">
                        {item.group}
                      </span>
                      <span className="truncate text-[13px] text-[var(--color-header-text)] transition-colors group-hover:text-[var(--color-sidebar-accent)]">
                        {item.label}
                      </span>
                    </div>
                    <ArrowRight size={13} className="shrink-0 text-[var(--color-header-muted)] transition-colors group-hover:text-[var(--color-sidebar-accent)]" />
                  </button>
                ))
              )}
            </div>

         
            <div className="flex items-center gap-3 border-t border-[var(--color-header-border)] px-4 py-2">
              <span className="text-[11px] text-[var(--color-header-muted)]">↑↓ navigate</span>
              <span className="text-[11px] text-[var(--color-header-muted)]">↵ open</span>
              <span className="ml-auto text-[11px] text-[var(--color-header-muted)]">ESC close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}