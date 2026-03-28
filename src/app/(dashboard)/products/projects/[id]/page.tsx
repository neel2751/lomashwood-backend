"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { useProject } from "@/hooks/useProjects";

import type { Project, ProjectDetail } from "@/types/product.types";

function formatCategory(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id || "";

  const projectQuery = useProject(projectId);
  const project = projectQuery.data as Project | undefined;

  if (projectQuery.isLoading) {
    return <div className="p-6 text-sm text-[#6B6B68]">Loading project...</div>;
  }

  if (projectQuery.isError || !project) {
    return <div className="p-6 text-sm text-red-600">Project not found.</div>;
  }

  const details = (Array.isArray(project.details) ? project.details : []) as ProjectDetail[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.title}
        description={`${formatCategory(project.category)} · ${project.location}`}
        backHref="/products/projects"
        backLabel="Projects"
        actionLabel="Edit Project"
        actionHref={`/products/projects/${project.id}/edit`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
          <h2 className="text-[14px] font-semibold text-[#1A1A18]">Overview</h2>
          <dl className="mt-3 space-y-2 text-sm text-[#2B2A28]">
            <div className="flex justify-between gap-3">
              <dt className="text-[#7A776F]">Category</dt>
              <dd>{formatCategory(project.category)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#7A776F]">Slug</dt>
              <dd>{project.slug}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#7A776F]">Completed</dt>
              <dd>{String(project.completedAt).slice(0, 10)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#7A776F]">Status</dt>
              <dd>{project.isPublished ? "Published" : "Draft"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#7A776F]">Public API URL</dt>
              <dd className="truncate text-right">/api/v1/projects/{project.slug}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
          <h2 className="text-[14px] font-semibold text-[#1A1A18]">Project Info</h2>
          <div className="mt-3 space-y-2 text-sm text-[#2B2A28]">
            <p>
              <span className="text-[#7A776F]">Style:</span> {project.style || "-"}
            </p>
            <p>
              <span className="text-[#7A776F]">Finish:</span> {project.finish || "-"}
            </p>
            <p>
              <span className="text-[#7A776F]">Layout:</span> {project.layout || "-"}
            </p>
            <p>
              <span className="text-[#7A776F]">Duration:</span> {project.duration || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
        <h2 className="text-[14px] font-semibold text-[#1A1A18]">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[#2B2A28]">{project.description}</p>
      </div>

      <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
        <h2 className="text-[14px] font-semibold text-[#1A1A18]">Images</h2>
        {project.images?.length ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {project.images.map((url) => (
              <div
                key={url}
                className="overflow-hidden rounded-[10px] border border-[#E8E6E1] bg-[#FCFBF9]"
              >
                <Image
                  src={url}
                  alt={project.title}
                  width={400}
                  height={240}
                  className="h-28 w-full object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#7A776F]">No images available.</p>
        )}
      </div>

      <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
        <h2 className="text-[14px] font-semibold text-[#1A1A18]">Details</h2>
        {details.length > 0 ? (
          <div className="mt-3 space-y-2">
            {details.map((entry) => (
              <div
                key={`${entry.label}-${entry.value}`}
                className="flex items-center justify-between rounded-xl border border-[#F0EEE9] px-3 py-2 text-sm"
              >
                <span className="text-[#7A776F]">{entry.label}</span>
                <span className="font-medium text-[#2B2A28]">{entry.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#7A776F]">No additional details added.</p>
        )}
      </div>

      <div>
        <Link
          href={`/products/projects/${project.id}/edit`}
          className="inline-flex h-10 items-center rounded-[9px] bg-[#1A1A18] px-4 text-sm font-medium text-white"
        >
          Edit Project
        </Link>
      </div>
    </div>
  );
}
