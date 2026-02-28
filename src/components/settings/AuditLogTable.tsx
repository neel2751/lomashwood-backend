"use client";

import { useState } from "react";

import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Shield,
  User,
  Settings,
  ShoppingBag,
  Calendar,
  Users,
  FileText,
  Bell,
  BarChart2,
  Trash2,
  Plus,
  Pencil,
  Lock,
  LogIn,
  LogOut,
  Key,
  AlertTriangle,
  Globe,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { formatters } from "@/utils/formatters";


// ── Types ─────────────────────────────────────────────────────────────────────

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "login_failed"
  | "password_change"
  | "role_assign"
  | "session_revoke"
  | "settings_change"
  | "export"
  | "publish"
  | "approve"
  | "cancel"
  | "refund";

type AuditResource =
  | "user"
  | "role"
  | "session"
  | "product"
  | "order"
  | "appointment"
  | "customer"
  | "review"
  | "blog"
  | "cms_page"
  | "landing_page"
  | "template"
  | "notification"
  | "settings"
  | "integration"
  | "analytics"
  | "refund"
  | "loyalty"
  | "showroom";

// ── Display config ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: React.ReactNode; style: string }> = {
  create: {
    label: "Created",
    icon: <Plus className="h-3.5 w-3.5" />,
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  update: {
    label: "Updated",
    icon: <Pencil className="h-3.5 w-3.5" />,
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  delete: {
    label: "Deleted",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    style: "bg-red-50 text-red-700 border-red-200",
  },
  login: {
    label: "Login",
    icon: <LogIn className="h-3.5 w-3.5" />,
    style: "bg-violet-50 text-violet-700 border-violet-200",
  },
  logout: {
    label: "Logout",
    icon: <LogOut className="h-3.5 w-3.5" />,
    style: "bg-muted text-muted-foreground",
  },
  login_failed: {
    label: "Login Failed",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    style: "bg-red-50 text-red-700 border-red-200",
  },
  password_change: {
    label: "Password Changed",
    icon: <Key className="h-3.5 w-3.5" />,
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  role_assign: {
    label: "Role Assigned",
    icon: <Shield className="h-3.5 w-3.5" />,
    style: "bg-purple-50 text-purple-700 border-purple-200",
  },
  session_revoke: {
    label: "Session Revoked",
    icon: <Lock className="h-3.5 w-3.5" />,
    style: "bg-orange-50 text-orange-700 border-orange-200",
  },
  settings_change: {
    label: "Settings Changed",
    icon: <Settings className="h-3.5 w-3.5" />,
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  export: {
    label: "Exported",
    icon: <Download className="h-3.5 w-3.5" />,
    style: "bg-muted text-muted-foreground",
  },
  publish: {
    label: "Published",
    icon: <Globe className="h-3.5 w-3.5" />,
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  approve: {
    label: "Approved",
    icon: <Eye className="h-3.5 w-3.5" />,
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancel: {
    label: "Cancelled",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    style: "bg-orange-50 text-orange-700 border-orange-200",
  },
  refund: {
    label: "Refunded",
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const RESOURCE_ICONS: Record<AuditResource, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  role: <Shield className="h-4 w-4" />,
  session: <Lock className="h-4 w-4" />,
  product: <ShoppingBag className="h-4 w-4" />,
  order: <ShoppingBag className="h-4 w-4" />,
  appointment: <Calendar className="h-4 w-4" />,
  customer: <Users className="h-4 w-4" />,
  review: <FileText className="h-4 w-4" />,
  blog: <FileText className="h-4 w-4" />,
  cms_page: <FileText className="h-4 w-4" />,
  landing_page: <Globe className="h-4 w-4" />,
  template: <Bell className="h-4 w-4" />,
  notification: <Bell className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  integration: <Settings className="h-4 w-4" />,
  analytics: <BarChart2 className="h-4 w-4" />,
  refund: <ShoppingBag className="h-4 w-4" />,
  loyalty: <Users className="h-4 w-4" />,
  showroom: <Globe className="h-4 w-4" />,
};

const PAGE_SIZE = 25;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function AuditLogDetail({ log, open, onClose }: { log: any; open: boolean; onClose: () => void }) {
  if (!log) return null;
  const actionCfg = ACTION_CONFIG[log.action as AuditAction];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[440px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Audit Log Entry</SheetTitle>
          <SheetDescription>{formatters.dateTime(log.createdAt)}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Action + resource */}
          <div className="flex flex-wrap gap-2">
            {actionCfg && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1.5 ${actionCfg.style}`}
              >
                {actionCfg.icon}
                {actionCfg.label}
              </Badge>
            )}
            <Badge variant="secondary" className="capitalize">
              {log.resource?.replace("_", " ")}
            </Badge>
          </div>

          {/* User */}
          <Card>
            <CardContent className="pt-4 space-y-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actor</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {log.userName ? getInitials(log.userName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{log.userName ?? "System"}</p>
                  <p className="text-xs text-muted-foreground">{log.userEmail ?? "—"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>{log.userRole ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono">{log.ipAddress ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">User Agent</span>
                <span className="text-xs text-right max-w-[200px] text-muted-foreground break-all">
                  {log.userAgent ?? "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Target */}
          <Card>
            <CardContent className="pt-4 space-y-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Target</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resource</span>
                <span className="capitalize">{log.resource?.replace("_", " ")}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resource ID</span>
                <span className="font-mono text-xs">{log.resourceId ?? "—"}</span>
              </div>
              {log.resourceLabel && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{log.resourceLabel}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Changes */}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Changes
                </p>
                <div className="space-y-2">
                  {Object.entries(log.changes).map(([key, change]: [string, any]) => (
                    <div key={key} className="text-sm">
                      <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 font-mono truncate">
                          {change.from !== undefined ? String(change.from) : "—"}
                        </div>
                        <div className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700 font-mono truncate">
                          {change.to !== undefined ? String(change.to) : "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {log.metadata && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Metadata
                </p>
                <pre className="text-xs font-mono bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Log ID</span>
              <span className="font-mono">{log.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Timestamp</span>
              <span>{formatters.dateTime(log.createdAt)}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export function AuditLogTable() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading, refetch, exportLogs } = useAuditLogs({
    search,
    action: actionFilter !== "all" ? actionFilter : undefined,
    resource: resourceFilter !== "all" ? resourceFilter : undefined,
    userId: userFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user, resource ID…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportLogs({ search, action: actionFilter, resource: resourceFilter })}>
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {(Object.keys(RESOURCE_ICONS) as AuditResource[]).map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(actionFilter !== "all" || resourceFilter !== "all" || search) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setActionFilter("all");
                  setResourceFilter("all");
                  setSearch("");
                  setUserFilter("");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {total.toLocaleString()} entries
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Shield className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No audit logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => {
                  const actionCfg = ACTION_CONFIG[log.action as AuditAction];
                  const resourceIcon = RESOURCE_ICONS[log.resource as AuditResource];
                  return (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatters.dateTime(log.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {log.userName ? getInitials(log.userName) : "S"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[110px]">
                              {log.userName ?? "System"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[110px]">
                              {log.userRole ?? ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {actionCfg ? (
                          <Badge
                            variant="outline"
                            className={`text-xs flex items-center gap-1 w-fit whitespace-nowrap ${actionCfg.style}`}
                          >
                            {actionCfg.icon}
                            {actionCfg.label}
                          </Badge>
                        ) : (
                          <span className="text-xs capitalize">{log.action}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-muted-foreground">{resourceIcon}</span>
                          <span className="capitalize text-xs">
                            {log.resource?.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          {log.resourceLabel && (
                            <p className="text-xs font-medium truncate max-w-[140px]">{log.resourceLabel}</p>
                          )}
                          {log.resourceId && (
                            <p className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">
                              {log.resourceId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {log.ipAddress ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {/* Jump to page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.min(
                  Math.max(1, page - 2) + i,
                  totalPages
                );
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <AuditLogDetail
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}