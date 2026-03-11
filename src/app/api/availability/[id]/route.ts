import { type NextRequest, NextResponse } from "next/server";

import { deleteAvailability, getAvailabilityById } from "@servers/availability.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getAvailabilityById(params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch availability item" },
      { status }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await deleteAvailability(params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to delete availability item" },
      { status }
    );
  }
}