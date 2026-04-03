import { NextResponse } from "next/server";

import { getActiveHeroSlides } from "@servers/hero.actions";
import { parseZodError } from "@servers/_shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const slides = await getActiveHeroSlides();
    return NextResponse.json(slides, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch hero slides" },
      {
        status,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
}
