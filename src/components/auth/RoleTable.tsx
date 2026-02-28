"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  Lock,
  Users,
  ChevronLeft,
  ChevronRight,
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
  DropdownMenuSeparator,
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
import { useRoles } from "@/hooks/useRoles";
import { formatters } from "@/utils/formatters";



const PAGE_SIZE = 20;

// Colour accent per role name heuristic
function getRoleAccent(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("super") || n.includes("admin")) return "bg-red-50 text-red-700 border-red-200";
  if (n.includes("manager")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (n.includes("editor") || n.includes("content")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (n.includes("consultant")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground";
}

export function RoleTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteRoleName, setDeleteRoleName] = useState("");

  const { data, isLoading, deleteRole } = useRoles({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const roles = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRole(deleteId);
    setDeleteId(null);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filters + New */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Button onClick={() => router.push("/auth/roles/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Role
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No roles found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/auth/roles/${role.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {role.isSystem && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                        <Badge
                          variant="outline"
                          className={`font-medium text-xs ${getRoleAccent(role.name)}`}
                        >
                          {role.name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {role.description ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{role.permissionCount ?? 0} permissions</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {role.userCount ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                          System
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Custom</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatters.date(role.createdAt)}
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
                          <DropdownMenuItem onClick={() => router.push(`/auth/roles/${role.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={role.isSystem}
                            onClick={() => router.push(`/auth/roles/${role.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={role.isSystem}
                            className="text-destructive focus:text-destructive disabled:opacity-50"
                            onClick={() => {
                              setDeleteId(role.id);
                              setDeleteRoleName(role.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />Delete
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{deleteRoleName}</strong> role?
              Users assigned to this role will lose their permissions. This action cannot be undone.
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