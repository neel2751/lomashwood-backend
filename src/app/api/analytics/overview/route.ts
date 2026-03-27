import { NextResponse } from "next/server";

import { getAnalyticsOverview } from "@servers/analytics.actions";
import { parseZodError } from "@servers/_shared";

export async function GET() {
  try {
    const data = await getAnalyticsOverview();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch analytics overview" },
      { status },
    );
  }
}
