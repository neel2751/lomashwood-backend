import { type NextRequest, NextResponse } from "next/server";

import { listShowrooms } from "@servers/showrooms.actions";
import { parseZodError } from "@servers/_shared";

import { toV1ShowroomList } from "./_transform";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listShowrooms(Object.fromEntries(searchParams));

    return NextResponse.json(toV1ShowroomList(data), { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch showrooms" },
      { status },
    );
  }
}
