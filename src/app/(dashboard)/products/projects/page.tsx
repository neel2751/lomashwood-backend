"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import Image from "next/image";

import { PageHeader } from "@/components/layout/PageHeader";
import { useDeleteProject, useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

import type { Project } from "@/types/product.types";

const SUB_NAV = [
  { href: "/products", label: "All Products" },
  { href: "/products/categories", label: "Categories" },
  { href: "/products/colours", label: "Colours" },
  { href: "/products/sizes", label: "Sizes" },
  { href: "/products/style", label: "Style" },
  { href: "/products/finish", label: "Finish" },
  { href: "/products/projects", label: "Projects" },
  { href: "/products/inventory", label: "Inventory" },
  { href: "/products/pricing", label: "Pricing" },
  { href: "/products/package", label: "Packages" },
];

export default function ProjectsPage() {
  const toast = useToast();
  const projectsQuery = useProjects({ page: 1, limit: 200 });
  const deleteProject = useDeleteProject();

  const [search, setSearch] = useState("");

  const projects = useMemo(
    () => ((projectsQuery.data as { data?: Project[] } | undefined)?.data ?? []) as Project[],
    [projectsQuery.data],
  );

  const filteredProjects = useMemo(() => {
    if (!search.trim()) {
      return projects;
    }

    const query = search.trim().toLowerCase();
    return projects.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete project \"${project.title}\"?`)) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete project", error?.message || "Please try again");
    }
  }

  const stats = [
    { label: "Total Projects", value: projects.length },
    { label: "Kitchen", value: projects.filter((item) => item.category === "kitchen").length },
    { label: "Bedroom", value: projects.filter((item) => item.category === "bedroom").length },
    {
      label: "Media Wall",
      value: projects.filter((item) => item.category === "media_wall").length,
    },
    { label: "Published", value: projects.filter((item) => item.isPublished).length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage completed project case studies for website and API consumption."
        actionLabel="Add Project"
        actionHref="/products/projects/new"
      />

      <nav className="flex gap-2 overflow-x-auto border-b border-[#E8E6E1]">
        {SUB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-9 items-center whitespace-nowrap px-3 text-sm ${
              item.href === "/products/projects"
                ? "border-b-2 border-[#1A1A18] font-semibold text-[#1A1A18]"
                : "text-[#6B6B68]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#E8E6E1] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#7A776F]">{stat.label}</p>
            <p className="mt-1 text-[24px] font-semibold text-[#1A1A18]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-[#E8E6E1] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-[#1A1A18]">Projects</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="h-9 w-[240px] rounded-[8px] border border-[#D9D5CD] bg-white px-3 text-[13px] text-[#2B2A28]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] text-left text-[10px] uppercase tracking-[0.08em] text-[#7A776F]">
                <th className="py-2 pr-3">Project</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Slug</th>
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">Completed</th>
                <th className="py-2 pr-3">Images</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE9]">
              {projectsQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-[#7A776F]">
                    Loading projects...
                  </td>
                </tr>
              ) : projectsQuery.isError ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-red-600">
                    Failed to load projects.
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-[#7A776F]">
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="text-[13px] text-[#2B2A28]">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        {project.images?.[0] ? (
                          <Image
                            src={project.images[0]}
                            alt={project.title}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-[8px] border border-[#E8E6E1] object-cover"
                            unoptimized
                          />
                        ) : null}
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="line-clamp-1 text-[11px] text-[#7A776F]">
                            {project.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">{project.category.replaceAll("_", " ")}</td>
                    <td className="py-3 pr-3">{project.slug}</td>
                    <td className="py-3 pr-3">{project.location}</td>
                    <td className="py-3 pr-3">{String(project.completedAt).slice(0, 10)}</td>
                    <td className="py-3 pr-3">{project.images?.length ?? 0}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          project.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {project.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/projects/${project.id}`}
                          className="rounded-[7px] border border-[#D9D5CD] px-2 py-1 text-[12px]"
                        >
                          View
                        </Link>
                        <Link
                          href={`/products/projects/${project.id}/edit`}
                          className="rounded-[7px] border border-[#D9D5CD] px-2 py-1 text-[12px]"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => void handleDelete(project)}
                          className="rounded-[7px] border border-red-200 px-2 py-1 text-[12px] text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
