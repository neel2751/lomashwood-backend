"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Search,
  MoreHorizontal,
  Eye,
  LogOut,
  Monitor,
  Smartphone,
  Globe,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSessions } from "@/hooks/useSessions";
import { formatters } from "@/utils/formatters";



const PAGE_SIZE = 20;

function DeviceIcon({ device }: { device?: string }) {
  if (!device) return <Globe className="h-4 w-4" />;
  const d = device.toLowerCase();
  if (d.includes("mobile") || d.includes("phone") || d.includes("ios") || d.includes("android")) {
    return <Smartphone className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

interface SessionTableProps {
  userId?: string; // optional filter by user
}

export function SessionTable({ userId }: SessionTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeAll, setRevokeAll] = useState(false);

  const { data, isLoading, revokeSession, revokeAllSessions, refetch } = useSessions({
    userId,
    search,
    activeOnly,
    page,
    pageSize: PAGE_SIZE,
  });

  const sessions = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleRevoke = async () => {
    if (!revokeId) return;
    await revokeSession(revokeId);
    setRevokeId(null);
  };

  const handleRevokeAll = async () => {
    await revokeAllSessions(userId);
    setRevokeAll(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IP, device, user..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Button
              variant={activeOnly ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveOnly(!activeOnly); setPage(1); }}
            >
              Active Only
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRevokeAll(true)}
          >
            <ShieldAlert className="h-4 w-4 mr-1.5" />
            Revoke All{userId ? " User" : ""} Sessions
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>User</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Monitor className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No sessions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/auth/sessions/${session.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{session.userName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{session.userEmail ?? ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <DeviceIcon device={session.deviceInfo} />
                        <span className="truncate max-w-[140px]">{session.deviceInfo ?? "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{session.ipAddress ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{session.location ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          session.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                            : "bg-muted text-muted-foreground text-xs"
                        }
                      >
                        {session.isActive ? "Active" : "Expired"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatters.dateTime(session.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {session.expiresAt ? formatters.dateTime(session.expiresAt) : "—"}
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
                          <DropdownMenuItem onClick={() => router.push(`/auth/sessions/${session.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />View Details
                          </DropdownMenuItem>
                          {session.isActive && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRevokeId(session.id)}
                            >
                              <LogOut className="h-4 w-4 mr-2" />Revoke Session
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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

      {/* Revoke single */}
      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately end this session. The user will be logged out on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleRevoke}>
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke all */}
      <AlertDialog open={revokeAll} onOpenChange={setRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              {userId
                ? "This will immediately end all active sessions for this user. They will be logged out on all devices."
                : "This will immediately end ALL active admin sessions across the entire system. All users will be logged out."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleRevokeAll}>
              Revoke All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}