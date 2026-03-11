import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";

const createColourSchema = z.object({
  name: z.string().trim().min(1),
  hexCode: z.string().trim().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { hexCode: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const data = await prisma.colour.findMany({
      where,
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ data, total: data.length }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch colours" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = createColourSchema.parse(body);

    const created = await prisma.colour.create({
      data: {
        name: payload.name,
        hexCode: payload.hexCode,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create colour" }, { status: 500 });
  }
}
