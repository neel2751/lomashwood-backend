import { type NextRequest, NextResponse } from "next/server";

import { getAvailableSlots } from "@servers/availability.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slots = await getAvailableSlots(Object.fromEntries(searchParams));
    const availableSlots = slots.filter((slot: { available: boolean }) => slot.available).length;

    return NextResponse.json(
      {
        date: searchParams.get("date"),
        consultantId: searchParams.get("consultantId") ?? null,
        totalSlots: slots.length,
        availableSlots,
        bookedSlots: slots.length - availableSlots,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch slot availability count" },
      { status }
    );
  }
}
