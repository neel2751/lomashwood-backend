import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { parseBoolean } from "@servers/_shared";

const createColourSchema = z.object({
  name: z.string().trim().min(1),
  hexCode: z.string().trim().min(1),
  isFeatured: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const featured = parseBoolean(searchParams.get("featured"));

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { hexCode: { contains: search, mode: "insensitive" as const } },
          ],
          ...(featured !== undefined ? { isFeatured: featured } : {}),
        }
      : featured !== undefined
        ? { isFeatured: featured }
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
        isFeatured: payload.isFeatured ?? false,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Invalid payload" },
        { status: 400 },
      );
    }
    if (error instanceof Error && /Unknown argument `isFeatured`/i.test(error.message)) {
      return NextResponse.json(
        {
          message:
            "Server Prisma client is out of date. Run `npm run prisma:generate` and restart the dev server.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ message: "Failed to create colour" }, { status: 500 });
  }
}
