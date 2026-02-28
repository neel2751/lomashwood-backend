"use client";

import { useNotification } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatters } from "@/utils/formatters";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationChannel } from "@/types/notification.types";

interface NotificationDetailProps {
  id: string;
}

const CHANNEL_META: Record<NotificationChannel, { icon: React.ReactNode; label: string; color: string }> = {
  email: { icon: <Mail className="h-5 w-5" />, label: "Email", color: "bg-blue-50 text-blue-700" },
  sms: { icon: <MessageSquare className="h-5 w-5" />, label: "SMS", color: "bg-violet-50 text-violet-700" },
  push: { icon: <Smartphone className="h-5 w-5" />, label: "Push Notification", color: "bg-emerald-50 text-emerald-700" },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  delivered: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  sent: <Send className="h-4 w-4 text-blue-600" />,
  pending: <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />,
  failed: <AlertCircle className="h-4 w-4 text-red-600" />,
  bounced: <AlertCircle className="h-4 w-4 text-orange-600" />,
};

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  bounced: "bg-orange-50 text-orange-700 border-orange-200",
};

export function NotificationDetail({ id }: NotificationDetailProps) {
  const router = useRouter();
  const { data: notification, isLoading, isError } = useNotification(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !notification) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Notification not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const channelMeta = CHANNEL_META[notification.channel];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Notifications
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${channelMeta.color}`}>
                    {channelMeta.icon}
                    {channelMeta.label}
                  </span>
                  <Badge
                    variant="outline"
                    className={`capitalize font-medium ${STATUS_STYLES[notification.status]}`}
                  >
                    <span className="mr-1.5">{STATUS_ICON[notification.status]}</span>
                    {notification.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatters.dateTime(notification.sentAt)}
                </span>
              </div>
              {notification.subject && (
                <CardTitle className="mt-3 text-xl leading-snug">{notification.subject}</CardTitle>
              )}
            </CardHeader>
          </Card>

          {/* Body */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Message Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notification.htmlBody ? (
                <div
                  className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/20"
                  dangerouslySetInnerHTML={{ __html: notification.htmlBody }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/20 rounded-lg p-4 font-sans leading-relaxed">
                  {notification.body ?? "—"}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Error details */}
          {notification.errorMessage && (
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Delivery Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600 font-mono">{notification.errorMessage}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recipient */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <User className="h-4 w-4" />
                Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notification.recipientName && (
                <p className="font-medium text-sm">{notification.recipientName}</p>
              )}
              <p className="text-sm text-muted-foreground break-all">{notification.recipientAddress}</p>
              {notification.customerId && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => router.push(`/customers/${notification.customerId}`)}
                >
                  View Customer Profile →
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Template</span>
                <span className="font-medium text-right">{notification.templateName ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Notification ID</span>
                <span className="font-mono text-xs text-right break-all">{notification.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Sent At
                </span>
                <span className="text-right">{formatters.dateTime(notification.sentAt)}</span>
              </div>
              {notification.deliveredAt && (
                <>
                  <Separator />
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Delivered At
                    </span>
                    <span className="text-right">{formatters.dateTime(notification.deliveredAt)}</span>
                  </div>
                </>
              )}
              {notification.retryCount !== undefined && notification.retryCount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retries</span>
                    <span>{notification.retryCount}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}