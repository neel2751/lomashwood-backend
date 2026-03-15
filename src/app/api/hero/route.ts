import { type NextRequest, NextResponse } from "next/server";

import { createHeroSlide, listHeroSlides } from "@servers/hero.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listHeroSlides(Object.fromEntries(searchParams));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch hero slides" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await createHeroSlide(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to create hero slide" },
      { status },
    );
  }
}
