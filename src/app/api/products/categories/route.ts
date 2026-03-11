import { type NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

type CategoryType = "kitchen" | "bedroom";

const CATEGORY_DEFINITIONS = [
  {
    id: "kitchen",
    name: "Kitchen",
    slug: "kitchen",
    type: "kitchen" as const,
    description: "All kitchen furniture, cabinets, and fitted units.",
  },
  {
    id: "bedroom",
    name: "Bedroom",
    slug: "bedroom",
    type: "bedroom" as const,
    description: "Fitted bedroom furniture, wardrobes, and storage.",
  },
];

async function buildCategory(definition: (typeof CATEGORY_DEFINITIONS)[number]) {
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
    id: definition.id,
    name: definition.name,
    slug: definition.slug,
    type: definition.type,
    category: definition.type,
    description: definition.description,
    productCount,
    createdAt: firstProduct?.createdAt.toISOString() ?? null,
    updatedAt: lastProduct?.updatedAt.toISOString() ?? null,
  };
}

function matchesSearch(category: Awaited<ReturnType<typeof buildCategory>>, search: string) {
  const needle = search.toLowerCase();

  return [category.name, category.slug, category.description, category.type].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const categories = await Promise.all(CATEGORY_DEFINITIONS.map((category) => buildCategory(category)));
    const data = search ? categories.filter((category) => matchesSearch(category, search)) : categories;

    return NextResponse.json({ data, total: data.length }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestedType = typeof body?.type === "string" ? (body.type as CategoryType) : null;

    if (requestedType && CATEGORY_DEFINITIONS.some((category) => category.type === requestedType)) {
      return NextResponse.json(
        { message: "Top-level product categories already exist and cannot be created." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Top-level product categories are fixed and cannot be created." },
      { status: 405 },
    );
  } catch {
    return NextResponse.json(
      { message: "Top-level product categories are fixed and cannot be created." },
      { status: 405 },
    );
  }
}