import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";

const createSizeSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const productId = searchParams.get("productId")?.trim();

    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(productId
        ? {
            products: {
              some: {
                productId,
              },
            },
          }
        : {}),
    };

    const data = await prisma.size.findMany({
      where,
      orderBy: [{ title: "asc" }],
    });

    return NextResponse.json({ data, total: data.length }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch sizes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = createSizeSchema.parse(body);

    const created = await prisma.size.create({
      data: {
        title: payload.title,
        description: payload.description || null,
        image: payload.image || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create size" }, { status: 500 });
  }
}
