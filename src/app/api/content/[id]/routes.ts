import { NextRequest, NextResponse } from "next/server";
import { createLomashApiClient } from "@/lib/api-client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = createLomashApiClient();
    const data = await client.content.getById(params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const client = createLomashApiClient();
    const data = await client.content.update(params.id, body);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Failed to update content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = createLomashApiClient();
    await client.content.delete(params.id);

    return NextResponse.json({ message: "Content deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Failed to delete content" },
      { status: 500 }
    );
  }
}