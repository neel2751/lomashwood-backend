"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { useDeleteBrochure, useBrochures } from "@/hooks/useBrochures";
import { useToast } from "@/hooks/use-toast";

import type { Brochure } from "@/types/content.types";

type BrochureResponse = {
  data: Brochure[];
  total: number;
};

export function BrochureTable() {
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState<"all" | "true" | "false">("all");
  const [published, setPublished] = useState<"all" | "true" | "false">("all");

  const toast = useToast();
  const deleteBrochure = useDeleteBrochure();

  const filters = useMemo(
    () => ({
      search: search || undefined,
      featured: featured === "all" ? undefined : featured === "true",
      isPublished: published === "all" ? undefined : published === "true",
      page: 1,
      limit: 100,
    }),
    [search, featured, published],
  );

  const { data, isLoading, isError } = useBrochures(filters);
  const response = (data ?? { data: [], total: 0 }) as BrochureResponse;

  async function handleDelete(id: string) {
    if (!confirm("Delete this brochure?")) return;

    try {
      await deleteBrochure.mutateAsync(id);
      toast.success("Brochure deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete brochure";
      toast.error("Failed to delete brochure", message);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-[#7A776F]">
        Loading brochures...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-red-600">
        Failed to load brochures.
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#E8E6E1] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E6E1] px-4 py-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search brochures"
          className="h-9 min-w-[220px] rounded-[9px] border border-[#E8E6E1] px-3 text-[12.5px]"
        />

        <select
          value={featured}
          onChange={(event) => setFeatured(event.target.value as "all" | "true" | "false")}
          className="h-9 rounded-[9px] border border-[#E8E6E1] px-3 text-[12.5px]"
        >
          <option value="all">All featured states</option>
          <option value="true">Featured only</option>
          <option value="false">Non-featured only</option>
        </select>

        <select
          value={published}
          onChange={(event) => setPublished(event.target.value as "all" | "true" | "false")}
          className="h-9 rounded-[9px] border border-[#E8E6E1] px-3 text-[12.5px]"
        >
          <option value="all">All publish states</option>
          <option value="true">Published only</option>
          <option value="false">Unpublished only</option>
        </select>

        <div className="ml-auto text-[12px] text-[#7A776F]">Total: {response.total}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] text-left text-[11px] text-[#7A776F]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Downloads</th>
              <th className="px-4 py-3 font-medium">Sort</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {response.data.map((brochure) => (
              <tr
                key={brochure.id}
                className="border-b border-[#F0EEE9] text-[13px] text-[#1A1A18]"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{brochure.title}</div>
                  <div className="text-[11px] text-[#7A776F]">/{brochure.slug}</div>
                </td>
                <td className="px-4 py-3">{brochure.category || "-"}</td>
                <td className="px-4 py-3">{brochure.isFeatured ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{brochure.isPublished ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{brochure.downloads}</td>
                <td className="px-4 py-3">{brochure.sortOrder}</td>
                <td className="px-4 py-3">{new Date(brochure.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/content/brochures/${brochure.id}`}
                      className="text-[#8B6914] hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(brochure.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {response.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[#7A776F]">
                  No brochures found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
