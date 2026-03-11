import { type NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

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

type Category = {
  id: string;
  name: string;
  slug: string;
  type: "kitchen" | "bedroom";
  category: "kitchen" | "bedroom";
  description: string;
  productCount: number;
};

function bySearch(item: Category, search: string) {
  const needle = search.toLowerCase();
  return [item.name, item.slug, item.type, item.description].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const counts = await prisma.product.groupBy({
      by: ["category"],
      where: { isPublished: true },
      _count: { _all: true },
    });

    const countByCategory = counts.reduce<Record<string, number>>((acc, row) => {
      acc[row.category] = row._count._all;
      return acc;
    }, {});

    const data = CATEGORY_DEFINITIONS.map((item) => ({
      ...item,
      category: item.type,
      productCount: countByCategory[item.type] ?? 0,
    }));

    const filtered = search ? data.filter((item) => bySearch(item, search)) : data;

    return NextResponse.json({ data: filtered, total: filtered.length }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
  }
}