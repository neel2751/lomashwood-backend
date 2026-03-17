import { type NextRequest, NextResponse } from "next/server";

import { createBrochure, listBrochures } from "@servers/brochures.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listBrochures(Object.fromEntries(searchParams));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch brochures" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await createBrochure(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to create brochure" },
      { status },
    );
  }
}
