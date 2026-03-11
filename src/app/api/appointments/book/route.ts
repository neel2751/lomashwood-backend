import { type NextRequest, NextResponse } from "next/server";

import { createAppointment } from "@servers/appointments.actions";
import { parseZodError } from "@servers/_shared";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await createAppointment(body);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to book appointment" },
      { status }
    );
  }
}
