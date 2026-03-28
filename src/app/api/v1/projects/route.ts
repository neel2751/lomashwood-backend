import { type NextRequest, NextResponse } from "next/server";

import { listPublicProjects } from "@servers/projects.actions";
import { parseZodError, searchParamsToQuery } from "@servers/_shared";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listPublicProjects(searchParamsToQuery(searchParams));

    return NextResponse.json(
      {
        ...data,
        data: data.data.map(toV1Project),
      },
      { status: 200 },
    );
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch projects" },
      { status },
    );
  }
}
