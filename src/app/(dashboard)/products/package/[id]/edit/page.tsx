"use client";

import { useMemo } from "react";

import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { PackageForm } from "@/components/products/PackageForm";
import { usePackage, useUpdatePackage } from "@/hooks/usePackages";
import { useToast } from "@/hooks/use-toast";

export default function EditPackagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const packageId = params?.id || "";

  const packageQuery = usePackage(packageId);
  const updatePackage = useUpdatePackage();

  const packageRecord = packageQuery.data as {
    title?: string;
    description?: string | null;
    image?: string | null;
    category?: "kitchen" | "bedroom";
    price?: number | null;
    features?: string[];
    isActive?: boolean;
  } | undefined;

  const initialValues = useMemo(() => ({
    title: packageRecord?.title ?? "",
    description: packageRecord?.description ?? "",
    image: packageRecord?.image ?? "",
    category: packageRecord?.category ?? "kitchen",
    price: packageRecord?.price ? String(packageRecord.price) : "",
    featuresText: (packageRecord?.features ?? []).join("\n"),
    isActive: packageRecord?.isActive ?? true,
  }), [packageRecord]);

  if (packageQuery.isLoading) {
    return <div className="p-6 text-sm text-[#6B6B68]">Loading package...</div>;
  }

  if (packageQuery.isError || !packageRecord) {
    return <div className="p-6 text-sm text-red-600">Failed to load package.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${packageRecord.title}`}
        description="Update the package details used throughout the product catalogue."
        backHref="/products/package"
        backLabel="Packages"
      />

      <PackageForm
        initialValues={initialValues}
        submitLabel="Save Package"
        isSaving={updatePackage.isPending}
        onSubmit={async (payload) => {
          await updatePackage.mutateAsync({ id: packageId, payload });
          toast.success("Package updated successfully");
          router.push("/products/package");
        }}
      />
    </div>
  );
}