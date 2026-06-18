import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { createAppointment } from "@servers/appointments.actions";
import { parseZodError } from "@servers/_shared";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  try {
    const data = await createAppointment(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: parseZodError(error) }, { status: 400 });
    }
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to create appointment" },
      { status }
    );
  }
}
