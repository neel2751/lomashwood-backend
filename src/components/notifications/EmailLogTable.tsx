"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Mail,
  Search,
  MoreHorizontal,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNotifications } from "@/hooks/useNotifications";
import { type NotificationStatus } from "@/types/notification.types";
import { formatters } from "@/utils/formatters";



const STATUS_CONFIG: Record<
  NotificationStatus,
  { label: string; icon: React.ReactNode; style: string }
> = {
  delivered: {
    label: "Delivered",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  sent: {
    label: "Sent",
    icon: <Mail className="h-3.5 w-3.5" />,
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    style: "bg-red-50 text-red-700 border-red-200",
  },
  bounced: {
    label: "Bounced",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    style: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

const PAGE_SIZE = 20;

export function EmailLogTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "all">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useNotifications({
    channel: "email",
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const emails = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search email address, subject..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as NotificationStatus | "all"); setPage(1); }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>To</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>Delivered At</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Mail className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No email logs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              emails.map((email) => {
                const statusCfg = STATUS_CONFIG[email.status];
                return (
                  <TableRow
                    key={email.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/notifications/email/${email.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{email.recipientName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{email.recipientAddress}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm truncate max-w-[200px]">{email.subject ?? "—"}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{email.templateName ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium flex items-center gap-1 w-fit ${statusCfg.style}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{formatters.dateTime(email.sentAt)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {email.deliveredAt ? formatters.dateTime(email.deliveredAt) : "—"}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/notifications/email/${email.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}