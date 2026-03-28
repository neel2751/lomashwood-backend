"use client";

import { useMemo } from "react";

import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectForm } from "@/components/products/ProjectForm";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

import type { Project, ProjectDetail } from "@/types/product.types";

function detailsToText(details: ProjectDetail[]) {
  return details.map((entry) => `${entry.label}: ${entry.value}`).join("\n");
}

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const projectId = params?.id || "";

  const projectQuery = useProject(projectId);
  const updateProject = useUpdateProject();

  const projectRecord = projectQuery.data as Project | undefined;

  const initialValues = useMemo(
    () => ({
      title: projectRecord?.title ?? "",
      slug: projectRecord?.slug ?? "",
      category: projectRecord?.category ?? "kitchen",
      location: projectRecord?.location ?? "",
      completedAt: projectRecord?.completedAt ? String(projectRecord.completedAt).slice(0, 10) : "",
      description: projectRecord?.description ?? "",
      images: projectRecord?.images ?? [],
      style: projectRecord?.style ?? "",
      finish: projectRecord?.finish ?? "",
      layout: projectRecord?.layout ?? "",
      duration: projectRecord?.duration ?? "",
      detailsText: detailsToText(
        Array.isArray(projectRecord?.details) ? projectRecord.details : [],
      ),
      isPublished: projectRecord?.isPublished ?? true,
    }),
    [projectRecord],
  );

  if (projectQuery.isLoading) {
    return <div className="p-6 text-sm text-[#6B6B68]">Loading project...</div>;
  }

  if (projectQuery.isError || !projectRecord) {
    return <div className="p-6 text-sm text-red-600">Failed to load project.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${projectRecord.title}`}
        description="Update project details used for website and API responses."
        backHref="/products/projects"
        backLabel="Projects"
      />

      <ProjectForm
        initialValues={initialValues}
        submitLabel="Save Project"
        isSaving={updateProject.isPending}
        onSubmit={async (payload) => {
          await updateProject.mutateAsync({ id: projectId, payload });
          toast.success("Project updated successfully");
          router.push("/products/projects");
        }}
      />
    </div>
  );
}
