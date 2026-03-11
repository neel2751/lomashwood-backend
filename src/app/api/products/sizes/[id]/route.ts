import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";

const updateSizeSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.size.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ message: "Size not found" }, { status: 404 });
    }
    return NextResponse.json(item, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch size" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const payload = updateSizeSchema.parse(body);

    const updated = await prisma.size.update({
      where: { id: params.id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description || null } : {}),
        ...(payload.image !== undefined ? { image: payload.image || null } : {}),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update size" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.size.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Size deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to delete size" }, { status: 500 });
  }
}
