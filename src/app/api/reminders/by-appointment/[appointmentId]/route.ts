import { type NextRequest, NextResponse } from "next/server";

import { getRemindersByAppointment } from "@servers/reminders.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await getRemindersByAppointment(
      params.appointmentId,
      Object.fromEntries(searchParams)
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch reminders" },
      { status }
    );
  }
}
