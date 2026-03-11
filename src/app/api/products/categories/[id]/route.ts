import { type NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

const CATEGORY_DEFINITIONS = {
  kitchen: {
    id: "kitchen",
    name: "Kitchen",
    slug: "kitchen",
    type: "kitchen" as const,
    description: "All kitchen furniture, cabinets, and fitted units.",
  },
  bedroom: {
    id: "bedroom",
    name: "Bedroom",
    slug: "bedroom",
    type: "bedroom" as const,
    description: "Fitted bedroom furniture, wardrobes, and storage.",
  },
};

async function buildCategory(id: keyof typeof CATEGORY_DEFINITIONS) {
  const definition = CATEGORY_DEFINITIONS[id];
  const [productCount, firstProduct, lastProduct] = await Promise.all([
    prisma.product.count({ where: { category: definition.type } }),
    prisma.product.findFirst({
      where: { category: definition.type },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.product.findFirst({
      where: { category: definition.type },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  return {
    ...definition,
    category: definition.type,
    productCount,
    createdAt: firstProduct?.createdAt.toISOString() ?? null,
    updatedAt: lastProduct?.updatedAt.toISOString() ?? null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id as keyof typeof CATEGORY_DEFINITIONS;

  if (!(id in CATEGORY_DEFINITIONS)) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  try {
    const data = await buildCategory(id);

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(params.id in CATEGORY_DEFINITIONS)) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(
    { message: "Top-level product categories are fixed and cannot be edited." },
    { status: 405 },
  );
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(params.id in CATEGORY_DEFINITIONS)) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(
    { message: "Top-level product categories are fixed and cannot be deleted." },
    { status: 405 },
  );
}