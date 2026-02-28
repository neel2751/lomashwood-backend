import { slugify, generateUuid, getInitials, truncate, groupBy, unique, chunk } from "@/lib/utils";

export { slugify, generateUuid, getInitials, truncate, groupBy, unique, chunk };

export function getFullName(
  firstName: string,
  lastName: string,
): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export function getAvatarFallback(name: string): string {
  return getInitials(name);
}

export function buildBreadcrumbs(
  pathname: string,
  labelMap?: Record<string, string>,
): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isId = /^[0-9a-f-]{36}$/.test(segment) || /^\d+$/.test(segment);
    const label = isId
      ? "Detail"
      : (labelMap?.[segment] ??
          segment
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "));
    return { label, href };
  });
}

export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  delta = 2,
): (number | "...")[] {
  const range: (number | "...")[] = [];
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }
  return range;
}

export function getPageCount(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), Math.max(1, totalPages));
}

export function getSelectedItems<T extends { id: string }>(
  items: T[],
  selectedIds: Set<string>,
): T[] {
  return items.filter((item) => selectedIds.has(item.id));
}

export function toggleSelection(
  selectedIds: Set<string>,
  id: string,
): Set<string> {
  const next = new Set(selectedIds);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export function toggleSelectAll<T extends { id: string }>(
  selectedIds: Set<string>,
  items: T[],
): Set<string> {
  const allSelected = items.every((item) => selectedIds.has(item.id));
  if (allSelected) return new Set();
  return new Set(items.map((item) => item.id));
}

export function isAllSelected<T extends { id: string }>(
  selectedIds: Set<string>,
  items: T[],
): boolean {
  return items.length > 0 && items.every((item) => selectedIds.has(item.id));
}

export function isSomeSelected<T extends { id: string }>(
  selectedIds: Set<string>,
  items: T[],
): boolean {
  return items.some((item) => selectedIds.has(item.id)) && !isAllSelected(selectedIds, items);
}

export function sortItems<T>(
  items: T[],
  key: keyof T,
  direction: "asc" | "desc",
): T[] {
  return [...items].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    const comparison =
      typeof valA === "string" && typeof valB === "string"
        ? valA.localeCompare(valB)
        : valA < valB
        ? -1
        : valA > valB
        ? 1
        : 0;
    return direction === "asc" ? comparison : -comparison;
  });
}

export function filterItems<T extends Record<string, unknown>>(
  items: T[],
  search: string,
  keys: (keyof T)[],
): T[] {
  if (!search.trim()) return items;
  const lower = search.toLowerCase();
  return items.filter((item) =>
    keys.some((key) => String(item[key] ?? "").toLowerCase().includes(lower)),
  );
}

export function objectToFormData(
  obj: Record<string, unknown>,
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (value instanceof File) {
      form.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File) {
          form.append(key, item);
        } else {
          form.append(key, String(item));
        }
      });
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function coerceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function noop(): void {}

export function identity<T>(value: T): T {
  return value;
}