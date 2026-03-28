import { type NextRequest, NextResponse } from "next/server";

import { deleteProject, getProjectById, updateProject } from "@servers/projects.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getProjectById(params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch project" },
      { status },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = await updateProject(params.id, body);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to update project" },
      { status },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteProject(params.id);

    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to delete project" },
      { status },
    );
  }
}
