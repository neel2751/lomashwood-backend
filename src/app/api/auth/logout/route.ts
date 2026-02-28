import { NextRequest, NextResponse } from "next/server";
import { createLomashApiClient } from "@/lib/api-client";

export async function POST(req: NextRequest) {
  try {
    const client = createLomashApiClient();
    await client.auth.logout();

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Logout failed" },
      { status: 500 }
    );
  }
}