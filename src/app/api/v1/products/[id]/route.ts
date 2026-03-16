import { type NextRequest, NextResponse } from "next/server";

import { getProductById } from "@servers/products.actions";
import { listProductOptions } from "@servers/product-options.actions";
import { parseZodError, searchParamsToQuery } from "@servers/_shared";
import prisma from "@/lib/prisma";

async function getPublicColours(req: NextRequest) {
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
}

async function getPublicSizes(req: NextRequest) {
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
    products: {
      some: {
        ...(productId ? { productId } : {}),
        product: {
          isPublished: true,
        },
      },
    },
  };

  const data = await prisma.size.findMany({
    where,
    orderBy: [{ title: "asc" }],
  });

  return NextResponse.json({ data, total: data.length }, { status: 200 });
}

async function getPublicFinishes(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParamsToQuery(searchParams);
  const data = await listProductOptions("finish", { ...query, isActive: "true" });

  return NextResponse.json(data, { status: 200 });
}

async function getPublicStyles(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParamsToQuery(searchParams);
  const data = await listProductOptions("style", { ...query, isActive: "true" });

  return NextResponse.json(data, { status: 200 });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (params.id === "colours") {
    return getPublicColours(req);
  }

  if (params.id === "sizes") {
    return getPublicSizes(req);
  }

  if (params.id === "finish") {
    return getPublicFinishes(req);
  }

  if (params.id === "style") {
    return getPublicStyles(req);
  }

  try {
    const data = await getProductById(params.id);

    if (!data.isPublished) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch product" },
      { status },
    );
  }
}
