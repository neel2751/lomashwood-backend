import { type NextRequest, NextResponse } from "next/server";

import { getBrochureRequestById } from "@servers/brochures.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getBrochureRequestById(params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch brochure request" },
      { status },
    );
  }
}
