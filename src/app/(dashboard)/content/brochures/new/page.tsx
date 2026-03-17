"use client";

import { useRouter } from "next/navigation";

import { BrochureForm } from "@/components/content/BrochureForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCreateBrochure } from "@/hooks/useBrochures";
import { useToast } from "@/hooks/use-toast";

import type { CreateBrochurePayload } from "@/types/content.types";

export default function NewBrochurePage() {
  const router = useRouter();
  const toast = useToast();
  const createBrochure = useCreateBrochure();

  async function handleSave(payload: CreateBrochurePayload) {
    try {
      await createBrochure.mutateAsync(payload);
      toast.success("Brochure created");
      router.push("/content/brochures");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create brochure";
      toast.error("Failed to create brochure", message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Brochure"
        description="Create a brochure and manage its metadata."
        backHref="/content/brochures"
      />

      <BrochureForm onSave={handleSave} isSubmitting={createBrochure.isPending} />
    </div>
  );
}

export const dynamic = "force-dynamic";
