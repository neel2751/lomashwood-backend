import { NextRequest, NextResponse } from "next/server";
import { createLomashApiClient } from "@/lib/api-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const client = createLomashApiClient();
    const data = await client.content.getAll(Object.fromEntries(searchParams));

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = createLomashApiClient();
    const data = await client.content.create(body);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Failed to create content" },
      { status: 500 }
    );
  }
}