"use client";

import {
  ShoppingBag, CalendarCheck, Star, RefreshCcw,
  MessageSquare, FileText, Gift, UserCheck, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type CustomerEventType =
  | "order_placed"
  | "appointment_booked"
  | "appointment_completed"
  | "review_submitted"
  | "refund_issued"
  | "support_ticket"
  | "brochure_requested"
  | "loyalty_earned"
  | "loyalty_redeemed"
  | "account_created"
  | "email_sent";

interface CustomerEvent {
  id: string;
  type: CustomerEventType;
  title: string;
  description?: string;
  linkLabel?: string;
  linkHref?: string;
  timestamp: string;
}

interface CustomerTimelineProps {
  events?: CustomerEvent[];
}

const EVENT_CONFIG: Record<CustomerEventType, { icon: React.ElementType; bg: string; color: string }> = {
  order_placed:           { icon: ShoppingBag,    bg: "bg-[#C8924A]/20",   color: "text-[#C8924A]"  },
  appointment_booked:     { icon: CalendarCheck,  bg: "bg-blue-400/15",    color: "text-blue-400"   },
  appointment_completed:  { icon: CalendarCheck,  bg: "bg-emerald-400/15", color: "text-emerald-400"},
  review_submitted:       { icon: Star,           bg: "bg-amber-400/15",   color: "text-amber-400"  },
  refund_issued:          { icon: RefreshCcw,     bg: "bg-amber-400/15",   color: "text-amber-400"  },
  support_ticket:         { icon: MessageSquare,  bg: "bg-red-400/15",     color: "text-red-400"    },
  brochure_requested:     { icon: FileText,       bg: "bg-[#6B8A9A]/15",   color: "text-[#6B8A9A]"  },
  loyalty_earned:         { icon: Gift,           bg: "bg-[#C8924A]/15",   color: "text-[#C8924A]"  },
  loyalty_redeemed:       { icon: Gift,           bg: "bg-purple-400/15",  color: "text-purple-400" },
  account_created:        { icon: UserCheck,      bg: "bg-emerald-400/15", color: "text-emerald-400"},
  email_sent:             { icon: Mail,           bg: "bg-[#6B8A9A]/15",   color: "text-[#6B8A9A]"  },
};

const DEFAULT_EVENTS: CustomerEvent[] = [
  { id: "1",  type: "account_created",       title: "Account Created",               description: "Customer registered via the Lomash Wood website.",             timestamp: "15 Jan 2025, 11:02" },
  { id: "2",  type: "brochure_requested",     title: "Brochure Requested",            description: "Requested the Kitchen Collection brochure.",                    timestamp: "18 Jan 2025, 14:15" },
  { id: "3",  type: "appointment_booked",     title: "Home Visit Booked",             description: "Booked with Sarah Alderton — Kitchen consultation.",            linkLabel: "View Appt", linkHref: "/appointments/1", timestamp: "20 Jan 2025, 09:40" },
  { id: "4",  type: "appointment_completed",  title: "Appointment Completed",         description: "Home visit completed. Customer selected Luna White.",           timestamp: "05 Feb 2025, 10:00" },
  { id: "5",  type: "email_sent",             title: "Follow-up Email Sent",          description: "Post-appointment follow-up email and brochure PDF sent.",       timestamp: "05 Feb 2025, 12:00" },
  { id: "6",  type: "order_placed",           title: "Order Placed — #1048",          description: "Luna White Kitchen — Standard · £8,400",                       linkLabel: "View Order", linkHref: "/orders/1", timestamp: "28 Feb 2025, 09:14" },
  { id: "7",  type: "loyalty_earned",         title: "840 Loyalty Points Earned",     description: "5 points per £1 spent on order #1048.",                        timestamp: "28 Feb 2025, 09:15" },
  { id: "8",  type: "review_submitted",       title: "5★ Review Submitted",           description: "\"Exceptional quality and service. The Luna White kitchen has transformed our home.\"", timestamp: "15 Mar 2025, 16:45" },
];

export function CustomerTimeline({ events = DEFAULT_EVENTS }: CustomerTimelineProps) {
  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      <h3 className="text-[14px] font-semibold text-[#E8D5B7] mb-5">Activity Timeline</h3>

      <div className="relative">
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[#2E231A]" />

        <div className="flex flex-col gap-0.5">
          {events.map((event) => {
            const cfg  = EVENT_CONFIG[event.type];
            const Icon = cfg.icon;
            return (
              <div key={event.id}
                className="relative flex items-start gap-4 pl-10 py-3 rounded-[10px] hover:bg-[#221A12] transition-colors group">
                {/* Icon bubble */}
                <div className={cn(
                  "absolute left-0 top-3 flex items-center justify-center",
                  "w-[30px] h-[30px] rounded-full border-2 border-[#1C1611] shrink-0",
                  cfg.bg
                )}>
                  <Icon size={13} className={cfg.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-medium text-[#C8B99A] group-hover:text-[#E8D5B7] transition-colors leading-snug">
                      {event.title}
                    </p>
                    <span className="text-[10.5px] text-[#3D2E1E] shrink-0 whitespace-nowrap mt-0.5">
                      {event.timestamp}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-[11.5px] text-[#5A4232] mt-0.5 leading-snug">
                      {event.description}
                    </p>
                  )}

                  {event.linkLabel && event.linkHref && (
                    <Link href={event.linkHref}
                      className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#C8924A] hover:underline">
                      {event.linkLabel} →
                    </Link>
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