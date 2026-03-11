import { type NextRequest, NextResponse } from "next/server";

import { getAnalyticsOverview } from "@servers/analytics.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    if (scope && scope !== "overview") {
      return NextResponse.json(
        { message: "Only overview scope is currently implemented" },
        { status: 400 }
      );
    }

    const data = await getAnalyticsOverview();

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch analytics" },
      { status }
    );
  }
}
