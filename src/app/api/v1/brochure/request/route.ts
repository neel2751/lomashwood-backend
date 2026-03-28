import { type NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { createBrochureRequest } from "@servers/brochures.actions";
import { parseZodError } from "@servers/_shared";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const incomingIds = Array.isArray(body?.brochureIds) ? (body.brochureIds as string[]) : [];

    if (incomingIds.length > 0) {
      const aliasToCategory: Record<string, string> = {
        kitchen: "kitchen",
        bedroom: "bedroom",
      };

      const realIds: string[] = [];

      for (const id of incomingIds) {
        const normalized = id.toLowerCase();
        const category = aliasToCategory[normalized];

        if (!category) {
          realIds.push(id);
          continue;
        }

        const brochure = await prisma.brochure.findFirst({
          where: {
            isPublished: true,
            OR: [
              { category: { contains: category, mode: "insensitive" } },
              { title: { contains: category, mode: "insensitive" } },
              { slug: { contains: category, mode: "insensitive" } },
            ],
          },
          orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
          select: { id: true },
        });

        if (brochure?.id) {
          realIds.push(brochure.id);
        }
      }

      body.brochureIds = [...new Set(realIds)];
    }

    const data = await createBrochureRequest(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to submit brochure request" },
      { status },
    );
  }
}
