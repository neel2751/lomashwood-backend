import { type NextRequest, NextResponse } from "next/server";

import { createApiClient } from "@/lib/api-client";

export async function POST(_req: NextRequest) {
  try {
    const client = createApiClient();
    await client.auth.logout();

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Logout failed" },
      { status: 500 }
    );
  }
}
