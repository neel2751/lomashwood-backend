"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRoles } from "@/hooks/useRoles";
import { roleSchema } from "@/schemas/role.schema";
import { PermissionsMatrix } from "./PermissionsMatrix";
import { ArrowLeft, Save, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  roleId?: string;
}

export function RoleForm({ roleId }: RoleFormProps) {
  const router = useRouter();
  const isEditing = !!roleId;

  const { getRole, createRole, updateRole, isSubmitting } = useRoles();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  useEffect(() => {
    if (isEditing) {
      getRole(roleId).then((role) => {
        if (role) {
          form.reset({
            name: role.name,
            description: role.description ?? "",
            permissions: role.permissions ?? [],
          });
        }
      });
    }
  }, [roleId, isEditing]);

  const onSubmit = async (data: RoleFormData) => {
    if (isEditing) {
      await updateRole(roleId, data);
    } else {
      await createRole(data);
    }
    router.push("/auth/roles");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Roles
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Role identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Role Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Content Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Brief description of this role's responsibilities..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Helps admins understand what this role is for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PermissionsMatrix
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />{isEditing ? "Update Role" : "Create Role"}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}