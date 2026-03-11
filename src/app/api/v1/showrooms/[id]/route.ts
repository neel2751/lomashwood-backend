import { type NextRequest, NextResponse } from "next/server";

import { getShowroomById } from "@servers/showrooms.actions";
import { parseZodError } from "@servers/_shared";

import { toV1Showroom } from "../_transform";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await getShowroomById(params.id);

    return NextResponse.json(toV1Showroom(data), { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch showroom" },
      { status },
    );
  }
}
