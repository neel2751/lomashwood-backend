"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CalendarCheck, ShoppingBag, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  appointment: "text-[#C8924A] bg-[#C8924A]/15",
  order: "text-blue-400 bg-blue-400/15",
  review: "text-amber-400 bg-amber-400/15",
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
          "text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A]",
          open && "bg-[#2E231A] text-[#C8924A]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8924A]/40"
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
        <div className="absolute right-0 top-[calc(100%+8px)] w-[360px] bg-[#1C1611] border border-[#2E231A] rounded-[14px] shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E231A]">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-[#E8D5B7]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-[#C8924A] bg-[#C8924A]/15 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-[#7A6045] hover:text-[#C8924A] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#2E231A]">
            {notifications.length === 0 ? (
              <p className="text-center text-[13px] text-[#5A4232] py-10">
                You're all caught up!
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 group hover:bg-[#221A12] transition-colors",
                    !notif.read && "bg-[#221A12]"
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
                    <p className={cn("text-[12.5px] font-medium leading-snug", notif.read ? "text-[#7A6045]" : "text-[#E8D5B7]")}>
                      {notif.title}
                    </p>
                    <p className="text-[11.5px] text-[#5A4232] leading-snug mt-0.5 line-clamp-2">
                      {notif.description}
                    </p>
                    <p className="text-[10.5px] text-[#3D2E1E] mt-1">{notif.time}</p>
                  </Link>

                  {/* Unread dot + dismiss */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8924A] mt-1.5" />
                    )}
                    <button
                      onClick={() => dismiss(notif.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3D2E1E] hover:text-[#C8924A]"
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
          <div className="px-4 py-2.5 border-t border-[#2E231A]">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}