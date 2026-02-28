"use client";

import { useState, useMemo } from "react";

import { Search, ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";


// ------------------------------------------------------------------
// Permission map aligned with Lomash Wood service architecture
// ------------------------------------------------------------------
export const PERMISSION_MODULES: {
  key: string;
  label: string;
  description: string;
  resources: {
    key: string;
    label: string;
    actions: { key: string; label: string }[];
  }[];
}[] = [
  {
    key: "products",
    label: "Products",
    description: "Kitchens, bedrooms, variants, pricing",
    resources: [
      {
        key: "products",
        label: "Products",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
          { key: "publish", label: "Publish" },
        ],
      },
      {
        key: "categories",
        label: "Categories",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "colours",
        label: "Colours",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "sizes",
        label: "Sizes / Units",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "inventory",
        label: "Inventory",
        actions: [
          { key: "view", label: "View" },
          { key: "edit", label: "Edit" },
        ],
      },
      {
        key: "pricing",
        label: "Pricing",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
    ],
  },
  {
    key: "orders",
    label: "Orders & Payments",
    description: "Orders, payments, invoices, refunds",
    resources: [
      {
        key: "orders",
        label: "Orders",
        actions: [
          { key: "view", label: "View" },
          { key: "edit", label: "Edit" },
          { key: "cancel", label: "Cancel" },
          { key: "export", label: "Export" },
        ],
      },
      {
        key: "payments",
        label: "Payments",
        actions: [
          { key: "view", label: "View" },
          { key: "refund", label: "Issue Refund" },
        ],
      },
      {
        key: "invoices",
        label: "Invoices",
        actions: [
          { key: "view", label: "View" },
          { key: "download", label: "Download" },
        ],
      },
      {
        key: "refunds",
        label: "Refunds",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "approve", label: "Approve" },
        ],
      },
    ],
  },
  {
    key: "appointments",
    label: "Appointments",
    description: "Bookings, consultants, availability",
    resources: [
      {
        key: "appointments",
        label: "Appointments",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "cancel", label: "Cancel" },
          { key: "export", label: "Export" },
        ],
      },
      {
        key: "availability",
        label: "Availability",
        actions: [
          { key: "view", label: "View" },
          { key: "edit", label: "Edit" },
        ],
      },
      {
        key: "consultants",
        label: "Consultants",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "reminders",
        label: "Reminders",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
        ],
      },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    description: "Customer profiles, reviews, support, loyalty",
    resources: [
      {
        key: "customers",
        label: "Customers",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
          { key: "export", label: "Export" },
        ],
      },
      {
        key: "reviews",
        label: "Reviews",
        actions: [
          { key: "view", label: "View" },
          { key: "approve", label: "Approve" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "support",
        label: "Support Tickets",
        actions: [
          { key: "view", label: "View" },
          { key: "edit", label: "Edit" },
          { key: "close", label: "Close" },
        ],
      },
      {
        key: "loyalty",
        label: "Loyalty",
        actions: [
          { key: "view", label: "View" },
          { key: "adjust", label: "Adjust Points" },
        ],
      },
    ],
  },
  {
    key: "content",
    label: "Content",
    description: "Blogs, media wall, CMS pages, SEO, landing pages",
    resources: [
      {
        key: "blogs",
        label: "Blog Posts",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
          { key: "publish", label: "Publish" },
        ],
      },
      {
        key: "media",
        label: "Media Wall",
        actions: [
          { key: "view", label: "View" },
          { key: "upload", label: "Upload" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "cms",
        label: "CMS Pages",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "seo",
        label: "SEO",
        actions: [
          { key: "view", label: "View" },
          { key: "edit", label: "Edit" },
        ],
      },
      {
        key: "landing_pages",
        label: "Landing Pages",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
    ],
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Email, SMS, push logs and templates",
    resources: [
      {
        key: "notification_logs",
        label: "Notification Logs",
        actions: [
          { key: "view", label: "View" },
        ],
      },
      {
        key: "templates",
        label: "Templates",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Tracking, funnels, dashboards, exports",
    resources: [
      {
        key: "analytics",
        label: "Analytics",
        actions: [
          { key: "view", label: "View" },
          { key: "export", label: "Export" },
        ],
      },
      {
        key: "funnels",
        label: "Funnels",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "dashboards",
        label: "Dashboards",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
    ],
  },
  {
    key: "auth",
    label: "Auth & Users",
    description: "Admin users, roles, sessions",
    resources: [
      {
        key: "users",
        label: "Users",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
          { key: "suspend", label: "Suspend" },
        ],
      },
      {
        key: "roles",
        label: "Roles",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Create" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "sessions",
        label: "Sessions",
        actions: [
          { key: "view", label: "View" },
          { key: "revoke", label: "Revoke" },
        ],
      },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    description: "General, security, integrations, audit logs",
    resources: [
      {
        key: "settings",
        label: "General Settings",
        actions: [
          { key: "view", label: "View" },
          { key: "edit", label: "Edit" },
        ],
      },
      {
        key: "audit_logs",
        label: "Audit Logs",
        actions: [
          { key: "view", label: "View" },
          { key: "export", label: "Export" },
        ],
      },
    ],
  },
];

// Build permission key: "resource:action"
function permKey(resource: string, action: string) {
  return `${resource}:${action}`;
}

interface PermissionsMatrixProps {
  value: string[];
  onChange: (permissions: string[]) => void;
}

export function PermissionsMatrix({ value, onChange }: PermissionsMatrixProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (perm: string) => {
    const next = new Set(selectedSet);
    if (next.has(perm)) {
      next.delete(perm);
    } else {
      next.add(perm);
    }
    onChange(Array.from(next));
  };

  const toggleResource = (resourceKey: string, actions: { key: string }[]) => {
    const perms = actions.map((a) => permKey(resourceKey, a.key));
    const allSelected = perms.every((p) => selectedSet.has(p));
    const next = new Set(selectedSet);
    if (allSelected) {
      perms.forEach((p) => next.delete(p));
    } else {
      perms.forEach((p) => next.add(p));
    }
    onChange(Array.from(next));
  };

  const toggleModule = (module: (typeof PERMISSION_MODULES)[0]) => {
    const allPerms = module.resources.flatMap((r) =>
      r.actions.map((a) => permKey(r.key, a.key))
    );
    const allSelected = allPerms.every((p) => selectedSet.has(p));
    const next = new Set(selectedSet);
    if (allSelected) {
      allPerms.forEach((p) => next.delete(p));
    } else {
      allPerms.forEach((p) => next.add(p));
    }
    onChange(Array.from(next));
  };

  const selectAll = () => {
    const all = PERMISSION_MODULES.flatMap((m) =>
      m.resources.flatMap((r) => r.actions.map((a) => permKey(r.key, a.key)))
    );
    onChange(all);
  };

  const clearAll = () => onChange([]);

  const filteredModules = useMemo(() => {
    if (!search.trim()) return PERMISSION_MODULES;
    const q = search.toLowerCase();
    return PERMISSION_MODULES.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.resources.some(
          (r) =>
            r.label.toLowerCase().includes(q) ||
            r.actions.some((a) => a.label.toLowerCase().includes(q))
        )
    );
  }, [search]);

  const totalSelected = selectedSet.size;
  const totalAvailable = PERMISSION_MODULES.flatMap((m) =>
    m.resources.flatMap((r) => r.actions)
  ).length;

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="secondary" className="text-xs">
            {totalSelected} / {totalAvailable} selected
          </Badge>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={selectAll}>
            Select All
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <Separator />

      {/* Modules */}
      <div className="space-y-3">
        {filteredModules.map((module) => {
          const modulePerms = module.resources.flatMap((r) =>
            r.actions.map((a) => permKey(r.key, a.key))
          );
          const selectedCount = modulePerms.filter((p) => selectedSet.has(p)).length;
          const allSelected = selectedCount === modulePerms.length;
          const isCollapsed = collapsed[module.key];

          return (
            <div key={module.key} className="rounded-lg border bg-white overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b">
                <Checkbox
                  id={`module-${module.key}`}
                  checked={allSelected}
                  onCheckedChange={() => toggleModule(module)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <button
                  type="button"
                  className="flex items-center gap-2 flex-1 text-left"
                  onClick={() => toggleCollapse(module.key)}
                >
                  <span className="font-semibold text-sm">{module.label}</span>
                  <span className="text-xs text-muted-foreground">{module.description}</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}/{modulePerms.length}
                    </Badge>
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                </button>
              </div>

              {/* Resources */}
              {!isCollapsed && (
                <div className="divide-y">
                  {module.resources.map((resource) => {
                    const resPerms = resource.actions.map((a) => permKey(resource.key, a.key));
                    const resSelected = resPerms.filter((p) => selectedSet.has(p)).length;
                    const resAllSelected = resSelected === resPerms.length;

                    return (
                      <div key={resource.key} className="flex items-center gap-4 px-4 py-3">
                        {/* Resource toggle */}
                        <div className="flex items-center gap-2 w-44 flex-shrink-0">
                          <Switch
                            checked={resAllSelected}
                            onCheckedChange={() => toggleResource(resource.key, resource.actions)}
                            className="scale-75"
                          />
                          <span className="text-sm font-medium">{resource.label}</span>
                        </div>

                        <Separator orientation="vertical" className="h-5" />

                        {/* Individual actions */}
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {resource.actions.map((action) => {
                            const perm = permKey(resource.key, action.key);
                            return (
                              <label
                                key={action.key}
                                className="flex items-center gap-1.5 cursor-pointer group"
                              >
                                <Checkbox
                                  checked={selectedSet.has(perm)}
                                  onCheckedChange={() => toggle(perm)}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                  {action.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredModules.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No permissions match your search.
          </p>
        )}
      </div>
    </div>
  );
}