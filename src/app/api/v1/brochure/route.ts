import { type NextRequest, NextResponse } from "next/server";

import { getFrontendBrochurePayload } from "@/lib/brochure-frontend-data";
import { parseZodError } from "@servers/_shared";

export async function GET(_req: NextRequest) {
  try {
    const data = getFrontendBrochurePayload();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch brochures" },
      { status },
    );
  }
}
