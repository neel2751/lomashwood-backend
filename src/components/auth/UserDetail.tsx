"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Pencil,
  Trash2,
  ShieldCheck,
  Clock,
  Monitor,
  UserCheck,
  UserX,
  AlertCircle,
  Mail,
  Calendar,
  Activity,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/useSessions";
import { useUsers } from "@/hooks/useUsers";
import { formatters } from "@/utils/formatters";




interface UserDetailProps {
  userId: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const { data: user, isLoading, isError, deleteUser, updateUserStatus } = useUsers({ id: userId });
  const { data: sessionsData } = useSessions({ userId, pageSize: 5 });
  const recentSessions = sessionsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteUser(userId);
    router.push("/auth/users");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Users
          </Button>
          <div className="flex gap-2">
            {user.status === "active" ? (
              <Button variant="outline" size="sm" onClick={() => updateUserStatus(userId, "suspended")}>
                <UserX className="h-4 w-4 mr-1.5" />
                Suspend
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => updateUserStatus(userId, "active")}>
                <UserCheck className="h-4 w-4 mr-1.5" />
                Activate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push(`/auth/users/${userId}/edit`)}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile + details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-semibold">{user.name}</h2>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs font-medium ${STATUS_STYLES[user.status]}`}
                      >
                        {user.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {user.roleName ?? "No role assigned"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />Email
                  </span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />Role
                  </span>
                  <span className="font-medium">{user.roleName ?? "—"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />Last Login
                  </span>
                  <span>{user.lastLoginAt ? formatters.dateTime(user.lastLoginAt) : "Never"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />Joined
                  </span>
                  <span>{formatters.date(user.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" />Active Sessions
                  </span>
                  <span>{user.activeSessionCount ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: recent sessions */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Recent Sessions
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => router.push(`/auth/sessions?userId=${userId}`)}
                >
                  View all →
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No sessions found</p>
                ) : (
                  recentSessions.map((session, i) => (
                    <div key={session.id}>
                      {i > 0 && <Separator className="mb-3" />}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate max-w-[140px]">
                            {session.deviceInfo ?? "Unknown device"}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${session.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {session.isActive ? "Active" : "Expired"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{session.ipAddress ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatters.dateTime(session.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{user.name}</strong>? This will permanently remove
              their account and revoke all active sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}