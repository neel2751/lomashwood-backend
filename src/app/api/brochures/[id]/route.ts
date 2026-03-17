import { type NextRequest, NextResponse } from "next/server";

import { deleteBrochure, getBrochureById, updateBrochure } from "@servers/brochures.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getBrochureById(params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch brochure" },
      { status },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = await updateBrochure(params.id, body);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to update brochure" },
      { status },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await deleteBrochure(params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to delete brochure" },
      { status },
    );
  }
}
