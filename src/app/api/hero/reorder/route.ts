import { type NextRequest, NextResponse } from "next/server";

import { reorderHeroSlides } from "@servers/hero.actions";
import { parseZodError } from "@servers/_shared";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slideIds } = body;

    if (!Array.isArray(slideIds)) {
      return NextResponse.json({ message: "slideIds must be an array" }, { status: 400 });
    }

    const data = await reorderHeroSlides(slideIds);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to reorder hero slides" },
      { status },
    );
  }
}
