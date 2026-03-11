"use client";

import { useState, useRef, useEffect } from "react";

import Link from "next/link";

import { Bell, CalendarCheck, ShoppingBag, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";

type NotifType = "appointment" | "order" | "review";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href: string;
}

// Mock notifications — replace with useNotifications() hook data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "appointment",
    title: "New Appointment Booked",
    description: "James Thornton booked a Kitchen consultation for 3 Mar.",
    time: "2m ago",
    read: false,
    href: "/appointments",
  },
  {
    id: "2",
    type: "order",
    title: "Order #1042 Placed",
    description: "A new bedroom order has been submitted and awaits processing.",
    time: "15m ago",
    read: false,
    href: "/orders",
  },
  {
    id: "3",
    type: "review",
    title: "New Customer Review",
    description: "Sarah M. left a 5-star review on the Luna White Kitchen.",
    time: "1h ago",
    read: false,
    href: "/customers/reviews",
  },
  {
    id: "4",
    type: "appointment",
    title: "Appointment Reminder",
    description: "Home measurement for Oliver P. is scheduled tomorrow at 10am.",
    time: "3h ago",
    read: true,
    href: "/appointments",
  },
  {
    id: "5",
    type: "order",
    title: "Refund Requested",
    description: "Customer Emma L. has requested a refund for Order #1038.",
    time: "5h ago",
    read: true,
    href: "/orders/refunds",
  },
];

const ICON_MAP: Record<NotifType, React.ReactNode> = {
  appointment: <CalendarCheck size={14} />,
  order: <ShoppingBag size={14} />,
  review: <Star size={14} />,
};

const COLOR_MAP: Record<NotifType, string> = {
  appointment: "text-[var(--color-sidebar-accent)] bg-[#F2E5CF]",
  order: "text-[#2B6EA7] bg-[#EAF3FA]",
  review: "text-[#A06A10] bg-[#FFF2D9]",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

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
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-[10px] transition-all",
          "text-[var(--color-header-muted)] hover:bg-[var(--color-header-hover)] hover:text-[var(--color-sidebar-accent)]",
          open && "bg-[var(--color-header-hover)] text-[var(--color-sidebar-accent)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-sidebar-accent)]/30"
        )}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#C8924A] text-[9px] font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-[14px] border border-[var(--color-header-border)] bg-[var(--color-header-panel)] shadow-2xl shadow-[rgba(92,72,41,0.18)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-header-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-[var(--color-header-text)]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#F2E5CF] px-2 py-0.5 text-[10px] font-bold text-[var(--color-sidebar-accent)]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-[var(--color-header-muted)] transition-colors hover:text-[var(--color-sidebar-accent)]"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] divide-y divide-[var(--color-header-border)] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-[var(--color-header-muted)]">
                You're all caught up!
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-header-hover)]",
                    !notif.read && "bg-[#FFF5E8]"
                  )}
                >
                  {/* Type icon */}
                  <div className={cn("shrink-0 flex items-center justify-center w-8 h-8 rounded-[8px] mt-0.5", COLOR_MAP[notif.type])}>
                    {ICON_MAP[notif.type]}
                  </div>

                  {/* Content */}
                  <Link
                    href={notif.href}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                      );
                      setOpen(false);
                    }}
                    className="flex-1 min-w-0"
                  >
                    <p className={cn("text-[12.5px] font-medium leading-snug", notif.read ? "text-[var(--color-header-muted)]" : "text-[var(--color-header-text)]")}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--color-header-muted)]">
                      {notif.description}
                    </p>
                    <p className="mt-1 text-[10.5px] text-[#9A8B7C]">{notif.time}</p>
                  </Link>

                  {/* Unread dot + dismiss */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8924A] mt-1.5" />
                    )}
                    <button
                      onClick={() => dismiss(notif.id)}
                      className="text-[var(--color-header-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--color-sidebar-accent)]"
                      aria-label="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-header-border)] px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-[12px] text-[var(--color-header-muted)] transition-colors hover:text-[var(--color-sidebar-accent)]"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}