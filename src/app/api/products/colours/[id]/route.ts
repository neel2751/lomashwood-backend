import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";

const updateColourSchema = z.object({
  name: z.string().trim().min(1).optional(),
  hexCode: z.string().trim().min(1).optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.colour.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ message: "Colour not found" }, { status: 404 });
    }
    return NextResponse.json(item, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch colour" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const payload = updateColourSchema.parse(body);

    const updated = await prisma.colour.update({
      where: { id: params.id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.hexCode !== undefined ? { hexCode: payload.hexCode } : {}),
        ...(payload.isFeatured !== undefined ? { isFeatured: payload.isFeatured } : {}),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Invalid payload" },
        { status: 400 },
      );
    }
    if (error instanceof Error && /Record to update not found/i.test(error.message)) {
      return NextResponse.json({ message: "Colour not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to update colour" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.colour.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Colour deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to delete colour" }, { status: 500 });
  }
}
