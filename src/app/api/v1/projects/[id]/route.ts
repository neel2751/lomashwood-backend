import { type NextRequest, NextResponse } from "next/server";

import { getProjectByIdOrSlug } from "@servers/projects.actions";
import { parseZodError } from "@servers/_shared";

function toApiCategory(category: string) {
  if (category === "kitchen") {
    return "Kitchen";
  }

  if (category === "bedroom") {
    return "Bedroom";
  }

  return "Media Wall";
}

function toV1Project(project: any) {
  return {
    ...project,
    category: toApiCategory(project.category),
    completedAt:
      project.completedAt instanceof Date
        ? project.completedAt.toISOString().slice(0, 10)
        : String(project.completedAt),
    details: Array.isArray(project.details) ? project.details : [],
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getProjectByIdOrSlug(params.id);

    if (!data.isPublished) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(toV1Project(data), { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch project" },
      { status },
    );
  }
}
