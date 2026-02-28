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

  // Keyboard shortcut ⌘K / Ctrl+K
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
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-[10px]",
          "bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232]",
          "hover:border-[#C8924A]/40 hover:text-[#C8924A] transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8924A]/40"
        )}
        aria-label="Open search"
      >
        <Search size={14} />
        <span className="text-[12px] hidden sm:block">Search...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-[5px] bg-[#221A12] border border-[#3D2E1E] text-[10px] text-[#5A4232] font-mono leading-none">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative w-full max-w-lg bg-[#1C1611] border border-[#3D2E1E] rounded-[14px] shadow-2xl shadow-black/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2E231A]">
              <Search size={16} className="text-[#C8924A] shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, products, orders..."
                className="flex-1 bg-transparent text-[14px] text-[#E8D5B7] placeholder:text-[#5A4232] focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[#5A4232] hover:text-[#C8924A]">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[340px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-center text-[13px] text-[#5A4232] py-8">No results found.</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#2E231A] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] text-[#5A4232] bg-[#2E231A] group-hover:bg-[#3D2E1E] px-2 py-0.5 rounded-full shrink-0 transition-colors">
                        {item.group}
                      </span>
                      <span className="text-[13px] text-[#9A7A5A] group-hover:text-[#E8D5B7] truncate transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <ArrowRight size={13} className="text-[#3D2E1E] group-hover:text-[#C8924A] shrink-0 transition-colors" />
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-[#2E231A]">
              <span className="text-[11px] text-[#3D2E1E]">↑↓ navigate</span>
              <span className="text-[11px] text-[#3D2E1E]">↵ open</span>
              <span className="text-[11px] text-[#3D2E1E] ml-auto">ESC close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}