"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useTemplates } from "@/hooks/useTemplates";
import { NotificationChannel } from "@/types/notification.types";
import { formatters } from "@/utils/formatters";
import {
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

const CHANNEL_ICONS: Record<NotificationChannel, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" />,
  sms: <MessageSquare className="h-3.5 w-3.5" />,
  push: <Smartphone className="h-3.5 w-3.5" />,
};

const CHANNEL_STYLES: Record<NotificationChannel, string> = {
  email: "bg-blue-50 text-blue-700 border-blue-200",
  sms: "bg-violet-50 text-violet-700 border-violet-200",
  push: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PAGE_SIZE = 20;

export function TemplateTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "all">("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, deleteTemplate } = useTemplates({
    search,
    channel: channelFilter !== "all" ? channelFilter : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const templates = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTemplate(deleteId);
    setDeleteId(null);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filters + New */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select
              value={channelFilter}
              onValueChange={(v) => { setChannelFilter(v as NotificationChannel | "all"); setPage(1); }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="push">Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => router.push("/notifications/templates/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Subject / Preview</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
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
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No templates found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/notifications/templates/new")}
                      >
                        Create your first template
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl) => (
                  <TableRow
                    key={tpl.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/notifications/templates/${tpl.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium text-sm">{tpl.name}</p>
                      {tpl.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {tpl.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium flex items-center gap-1 w-fit capitalize ${CHANNEL_STYLES[tpl.channel]}`}
                      >
                        {CHANNEL_ICONS[tpl.channel]}
                        {tpl.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm truncate max-w-[200px] text-muted-foreground">
                        {tpl.subject ?? tpl.bodyPreview ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {tpl.variables && tpl.variables.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tpl.variables.slice(0, 3).map((v) => (
                            <Badge key={v} variant="secondary" className="text-xs font-mono">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                          {tpl.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{tpl.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={tpl.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                          : "bg-muted text-muted-foreground text-xs"
                        }
                      >
                        {tpl.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatters.dateTime(tpl.updatedAt)}
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
                          <DropdownMenuItem onClick={() => router.push(`/notifications/templates/${tpl.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/notifications/templates/${tpl.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(tpl.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}