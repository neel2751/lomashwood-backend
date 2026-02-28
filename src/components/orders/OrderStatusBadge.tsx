"use client";

import {
  Clock, CheckCircle, Truck, Package,
  XCircle, RefreshCcw, AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; bg: string; text: string; dot: string }
> = {
  pending:    { label: "Pending",    icon: Clock,        bg: "bg-[#6B8A9A]/15", text: "text-[#6B8A9A]",  dot: "bg-[#6B8A9A]"  },
  processing: { label: "Processing", icon: AlertCircle,  bg: "bg-[#C8924A]/15", text: "text-[#C8924A]",  dot: "bg-[#C8924A]"  },
  confirmed:  { label: "Confirmed",  icon: CheckCircle,  bg: "bg-blue-400/10",  text: "text-blue-400",   dot: "bg-blue-400"   },
  dispatched: { label: "Dispatched", icon: Truck,        bg: "bg-purple-400/10",text: "text-purple-400", dot: "bg-purple-400" },
  delivered:  { label: "Delivered",  icon: Package,      bg: "bg-teal-400/10",  text: "text-teal-400",   dot: "bg-teal-400"   },
  completed:  { label: "Completed",  icon: CheckCircle,  bg: "bg-emerald-400/10",text:"text-emerald-400",dot: "bg-emerald-400"},
  cancelled:  { label: "Cancelled",  icon: XCircle,      bg: "bg-red-400/10",   text: "text-red-400",    dot: "bg-red-400"    },
  refunded:   { label: "Refunded",   icon: RefreshCcw,   bg: "bg-amber-400/10", text: "text-amber-400",  dot: "bg-amber-400"  },
};

export function OrderStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        config.bg,
        config.text,
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"
      )}
    >
      {showIcon ? (
        <Icon size={size === "sm" ? 10 : 12} />
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      )}
      {config.label}
    </span>
  );
}