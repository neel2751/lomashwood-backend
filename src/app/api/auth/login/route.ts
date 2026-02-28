import { NextRequest, NextResponse } from "next/server";
import { createLomashApiClient } from "@/lib/api-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = createLomashApiClient();
    const data = await client.auth.login(body);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Login failed" },
      { status: 401 }
    );
  }
}