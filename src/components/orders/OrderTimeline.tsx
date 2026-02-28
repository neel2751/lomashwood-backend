"use client";

import {
  ShoppingBag, CreditCard, CheckCircle,
  Truck, Package, XCircle, RefreshCcw,
  FileText, MessageSquare, User,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type TimelineEventType =
  | "order_placed"
  | "payment_received"
  | "order_confirmed"
  | "dispatched"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund_requested"
  | "refund_processed"
  | "invoice_generated"
  | "note_added"
  | "status_changed";

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  actor?: string;
  timestamp: string;
}

interface OrderTimelineProps {
  events?: TimelineEvent[];
}

const EVENT_CONFIG: Record<
  TimelineEventType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  order_placed:      { icon: ShoppingBag,    bg: "bg-[#C8924A]/20",    color: "text-[#C8924A]"  },
  payment_received:  { icon: CreditCard,     bg: "bg-emerald-400/15",  color: "text-emerald-400"},
  order_confirmed:   { icon: CheckCircle,    bg: "bg-blue-400/15",     color: "text-blue-400"   },
  dispatched:        { icon: Truck,          bg: "bg-purple-400/15",   color: "text-purple-400" },
  delivered:         { icon: Package,        bg: "bg-teal-400/15",     color: "text-teal-400"   },
  completed:         { icon: CheckCircle,    bg: "bg-emerald-400/15",  color: "text-emerald-400"},
  cancelled:         { icon: XCircle,        bg: "bg-red-400/15",      color: "text-red-400"    },
  refund_requested:  { icon: RefreshCcw,     bg: "bg-amber-400/15",    color: "text-amber-400"  },
  refund_processed:  { icon: RefreshCcw,     bg: "bg-amber-400/15",    color: "text-amber-400"  },
  invoice_generated: { icon: FileText,       bg: "bg-[#6B8A9A]/15",    color: "text-[#6B8A9A]"  },
  note_added:        { icon: MessageSquare,  bg: "bg-[#8B6B4A]/15",    color: "text-[#C8B99A]"  },
  status_changed:    { icon: User,           bg: "bg-[#6B8A9A]/15",    color: "text-[#6B8A9A]"  },
};

const DEFAULT_EVENTS: TimelineEvent[] = [
  { id: "1", type: "order_placed",     title: "Order Placed",           description: "Customer submitted the order via the website.",          actor: "Customer",    timestamp: "28 Feb 2026, 09:14" },
  { id: "2", type: "payment_received", title: "Payment Received",       description: "£8,400 received via card payment. Transaction #TXN9821.", actor: "System",      timestamp: "28 Feb 2026, 09:15" },
  { id: "3", type: "invoice_generated",title: "Invoice Generated",      description: "Invoice #INV-1048 generated and sent to customer.",       actor: "System",      timestamp: "28 Feb 2026, 09:16" },
  { id: "4", type: "order_confirmed",  title: "Order Confirmed",        description: "Order reviewed and confirmed by the sales team.",         actor: "Admin",       timestamp: "28 Feb 2026, 11:30" },
  { id: "5", type: "note_added",       title: "Note Added",             description: "\"Customer requested delivery before 5pm.\"",             actor: "Sarah (CRM)", timestamp: "28 Feb 2026, 14:00" },
  { id: "6", type: "dispatched",       title: "Order Dispatched",       description: "Handed to installation team. Estimated arrival: 5 Mar.", actor: "Warehouse",   timestamp: "04 Mar 2026, 08:00" },
];

export function OrderTimeline({ events = DEFAULT_EVENTS }: OrderTimelineProps) {
  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-5">Order Timeline</h3>

      <div className="relative">
        {/* Vertical connector */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[#2E231A]" />

        <div className="flex flex-col gap-0.5">
          {events.map((event, i) => {
            const config = EVENT_CONFIG[event.type];
            const Icon = config.icon;
            const isLast = i === events.length - 1;

            return (
              <div
                key={event.id}
                className={cn(
                  "relative flex items-start gap-4 pl-10 py-3 rounded-[10px]",
                  "hover:bg-[#221A12] transition-colors group"
                )}
              >
                {/* Icon bubble */}
                <div
                  className={cn(
                    "absolute left-0 top-3 flex items-center justify-center",
                    "w-[30px] h-[30px] rounded-full border-2 border-[#1C1611] shrink-0",
                    config.bg
                  )}
                >
                  <Icon size={13} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-medium text-[#C8B99A] group-hover:text-[#E8D5B7] transition-colors leading-snug">
                      {event.title}
                    </p>
                    <span className="text-[10.5px] text-[#3D2E1E] shrink-0 mt-0.5 whitespace-nowrap">
                      {event.timestamp}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-[11.5px] text-[#5A4232] mt-0.5 leading-snug">
                      {event.description}
                    </p>
                  )}

                  {event.actor && (
                    <p className="text-[10.5px] text-[#3D2E1E] mt-1">
                      By <span className="text-[#7A6045]">{event.actor}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}