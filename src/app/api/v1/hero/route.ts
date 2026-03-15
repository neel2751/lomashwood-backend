import { NextResponse } from "next/server";

import { getActiveHeroSlides } from "@servers/hero.actions";
import { parseZodError } from "@servers/_shared";

export async function GET() {
  try {
    const slides = await getActiveHeroSlides();
    return NextResponse.json(slides, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch hero slides" },
      { status },
    );
  }
}
