"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { PackageForm } from "@/components/products/PackageForm";
import { useCreatePackage } from "@/hooks/usePackages";
import { useToast } from "@/hooks/use-toast";

export default function NewPackagePage() {
  const router = useRouter();
  const toast = useToast();
  const createPackage = useCreatePackage();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Package"
        description="Create a package that products can be grouped under in the catalogue."
        backHref="/products/package"
        backLabel="Packages"
      />

      <PackageForm
        submitLabel="Create Package"
        isSaving={createPackage.isPending}
        onSubmit={async (payload) => {
          await createPackage.mutateAsync(payload);
          toast.success("Package created successfully");
          router.push("/products/package");
        }}
      />
    </div>
  );
}