"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { ColourForm } from "@/components/products/ColourForm";
import { useColor, useDeleteColor, useUpdateColor } from "@/hooks/useColours";
import { useToast } from "@/hooks/use-toast";

export default function ColourDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const colourId = typeof params?.id === "string" ? params.id : "";

  const colorQuery = useColor(colourId);
  const updateColor = useUpdateColor();
  const deleteColor = useDeleteColor();

  const item = (colorQuery.data ?? null) as {
    id: string;
    name: string;
    hexCode: string;
    isFeatured?: boolean;
  } | null;

  async function handleSave(data: { name: string; hex: string; isFeatured: boolean }) {
    const targetId = item?.id ?? colourId;
    if (!targetId) {
      toast.error("Failed to update colour", "Invalid colour id");
      return;
    }

    try {
      await updateColor.mutateAsync({
        id: targetId,
        payload: {
          name: data.name,
          hexCode: data.hex,
          isFeatured: data.isFeatured,
        },
      });
      toast.success("Colour updated");
      router.push("/products/colours");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update colour";
      toast.error("Failed to update colour", message);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this colour?")) return;

    const targetId = item?.id ?? colourId;
    if (!targetId) {
      toast.error("Failed to delete colour", "Invalid colour id");
      return;
    }

    try {
      await deleteColor.mutateAsync(targetId);
      toast.success("Colour deleted");
      router.push("/products/colours");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete colour";
      toast.error("Failed to delete colour", message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={item?.name ?? "Edit Colour"}
          description="Update colour details and featured status"
          backHref="/products/colours"
          backLabel="Colours"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteColor.isPending}
          className="inline-flex h-9 items-center rounded-[9px] border border-red-200 px-4 text-[12.5px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteColor.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>

      {colorQuery.isLoading ? (
        <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-[#7A776F]">
          Loading colour...
        </div>
      ) : colorQuery.isError || !item ? (
        <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-red-500">
          Failed to load colour.{" "}
          <Link href="/products/colours" className="underline">
            Go back
          </Link>
        </div>
      ) : (
        <ColourForm
          initialData={{
            name: item.name,
            hex: item.hexCode,
            isFeatured: item.isFeatured ?? false,
          }}
          onSave={handleSave}
          isEdit
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
