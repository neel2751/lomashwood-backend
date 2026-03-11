import { type NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const productId = searchParams.get("productId")?.trim();

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { hexCode: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      products: {
        some: {
          ...(productId ? { productId } : {}),
          product: {
            isPublished: true,
          },
        },
      },
    };

    const data = await prisma.colour.findMany({
      where,
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ data, total: data.length }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch colours" }, { status: 500 });
  }
}