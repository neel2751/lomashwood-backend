import { type NextRequest, NextResponse } from "next/server";

import { incrementBrochureDownload } from "@servers/brochures.actions";
import { parseZodError } from "@servers/_shared";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await incrementBrochureDownload(params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to track brochure download" },
      { status },
    );
  }
}
