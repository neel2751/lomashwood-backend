"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectForm } from "@/components/products/ProjectForm";
import { useCreateProject } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

export default function NewProjectPage() {
  const router = useRouter();
  const toast = useToast();
  const createProject = useCreateProject();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Project"
        description="Create a project case study for website and API consumption."
        backHref="/products/projects"
        backLabel="Projects"
      />

      <ProjectForm
        submitLabel="Create Project"
        isSaving={createProject.isPending}
        onSubmit={async (payload) => {
          await createProject.mutateAsync(payload);
          toast.success("Project created successfully");
          router.push("/products/projects");
        }}
      />
    </div>
  );
}
