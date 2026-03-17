"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { BrochureForm } from "@/components/content/BrochureForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useBrochure, useDeleteBrochure, useUpdateBrochure } from "@/hooks/useBrochures";
import { useToast } from "@/hooks/use-toast";

import type { Brochure, CreateBrochurePayload } from "@/types/content.types";

export default function BrochureDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const brochureId = typeof params?.id === "string" ? params.id : "";

  const brochureQuery = useBrochure(brochureId);
  const updateBrochure = useUpdateBrochure();
  const deleteBrochure = useDeleteBrochure();

  const brochure = (brochureQuery.data ?? null) as Brochure | null;

  async function handleSave(payload: CreateBrochurePayload) {
    if (!brochureId) return;

    try {
      await updateBrochure.mutateAsync({ id: brochureId, payload });
      toast.success("Brochure updated");
      router.push("/content/brochures");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update brochure";
      toast.error("Failed to update brochure", message);
    }
  }

  async function handleDelete() {
    if (!brochureId || !confirm("Delete this brochure?")) return;

    try {
      await deleteBrochure.mutateAsync(brochureId);
      toast.success("Brochure deleted");
      router.push("/content/brochures");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete brochure";
      toast.error("Failed to delete brochure", message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={brochure?.title ?? "Edit Brochure"}
          description="Update brochure details and publication settings."
          backHref="/content/brochures"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteBrochure.isPending}
          className="inline-flex h-9 items-center rounded-[9px] border border-red-200 px-4 text-[12.5px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteBrochure.isPending ? "Deleting..." : "Delete"}
        </button>
      </div>

      {brochureQuery.isLoading ? (
        <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-[#7A776F]">
          Loading brochure...
        </div>
      ) : brochureQuery.isError || !brochure ? (
        <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-red-500">
          Failed to load brochure.{" "}
          <Link href="/content/brochures" className="underline">
            Go back
          </Link>
        </div>
      ) : (
        <BrochureForm
          initialData={{
            title: brochure.title,
            slug: brochure.slug,
            description: brochure.description ?? undefined,
            coverImage: brochure.coverImage ?? undefined,
            pdfUrl: brochure.pdfUrl,
            category: brochure.category ?? undefined,
            tags: brochure.tags,
            pages: brochure.pages ?? undefined,
            sizeMb: brochure.sizeMb ?? undefined,
            year: brochure.year ?? undefined,
            sortOrder: brochure.sortOrder,
            isFeatured: brochure.isFeatured,
            isPublished: brochure.isPublished,
          }}
          onSave={handleSave}
          isEdit
          isSubmitting={updateBrochure.isPending}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
