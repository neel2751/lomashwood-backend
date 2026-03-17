import { type NextRequest, NextResponse } from "next/server";

import { listBrochureRequests } from "@servers/brochures.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listBrochureRequests(Object.fromEntries(searchParams));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch brochure requests" },
      { status },
    );
  }
}
