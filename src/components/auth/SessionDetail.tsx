"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Globe,
  MapPin,
  Clock,
  User,
  LogOut,
  AlertCircle,
  ShieldCheck,
  Network,
  Fingerprint,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/useSessions";
import { formatters } from "@/utils/formatters";




interface SessionDetailProps {
  sessionId: string;
}

function DeviceIcon({ device }: { device?: string }) {
  if (!device) return <Globe className="h-5 w-5" />;
  const d = device.toLowerCase();
  if (d.includes("mobile") || d.includes("phone") || d.includes("ios") || d.includes("android")) {
    return <Smartphone className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const router = useRouter();
  const [showRevoke, setShowRevoke] = useState(false);

  const { data: session, isLoading, isError, revokeSession } = useSessions({ id: sessionId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Session not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const handleRevoke = async () => {
    await revokeSession(sessionId);
    setShowRevoke(false);
    router.push("/auth/sessions");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Sessions
          </Button>
          {session.isActive && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              onClick={() => setShowRevoke(true)}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Revoke Session
            </Button>
          )}
        </div>

        {/* Status banner */}
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
            session.isActive
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-muted border-border text-muted-foreground"
          }`}
        >
          <ShieldCheck className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              {session.isActive ? "Session Active" : "Session Expired"}
            </p>
            <p className="text-xs mt-0.5">
              {session.isActive
                ? `Expires ${formatters.dateTime(session.expiresAt)}`
                : `Ended ${formatters.dateTime(session.expiresAt ?? session.updatedAt)}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Device & network */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <DeviceIcon device={session.deviceInfo} />
                Device & Network
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5" />Device
                </span>
                <span className="font-medium text-right max-w-[200px]">
                  {session.deviceInfo ?? "Unknown"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />Browser
                </span>
                <span className="text-right">{session.browser ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Network className="h-3.5 w-3.5" />IP Address
                </span>
                <span className="font-mono">{session.ipAddress ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />Location
                </span>
                <span className="text-right">{session.location ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5" />User Agent
                </span>
                <span className="text-right text-xs max-w-[200px] text-muted-foreground break-all">
                  {session.userAgent ?? "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timing & user */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{session.userName ?? "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{session.userEmail ?? "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span>{session.userRole ?? "—"}</span>
                </div>
                {session.userId && (
                  <>
                    <Separator />
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => router.push(`/auth/users/${session.userId}`)}
                    >
                      View User Profile →
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session ID</span>
                  <span className="font-mono text-xs truncate max-w-[160px]">{session.id}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatters.dateTime(session.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{session.expiresAt ? formatters.dateTime(session.expiresAt) : "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showRevoke} onOpenChange={setShowRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately end this session for{" "}
              <strong>{session.userName ?? "this user"}</strong> on their{" "}
              {session.deviceInfo ?? "device"}. They will be logged out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleRevoke}>
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}