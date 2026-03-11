import { type NextRequest, NextResponse } from "next/server";

import { parseZodError } from "@servers/_shared";
import { sendAppointmentEmail } from "@servers/appointments.actions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const data = await sendAppointmentEmail(params.id, body?.type);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to send appointment email" },
      { status }
    );
  }
}
