import { type NextRequest, NextResponse } from "next/server";

import { createProject, listProjects } from "@servers/projects.actions";
import { parseZodError, searchParamsToQuery } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listProjects(searchParamsToQuery(searchParams));

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch projects" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await createProject(body);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to create project" },
      { status },
    );
  }
}
