import { type NextRequest, NextResponse } from "next/server";

import { listWeeklyPattern, upsertWeeklyPattern } from "@servers/availability.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listWeeklyPattern(Object.fromEntries(searchParams));

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch weekly pattern" },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await upsertWeeklyPattern(body);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to save weekly pattern" },
      { status }
    );
  }
}
