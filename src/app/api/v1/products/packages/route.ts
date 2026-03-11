import { type NextRequest, NextResponse } from "next/server";

import { listPackages } from "@servers/packages.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const data = await listPackages({ ...query, isActive: "true" });

    const filteredData = data.data.map((item) => {
      const publishedProducts = item.products.filter((product) => product.isPublished);
      return {
        ...item,
        products: publishedProducts,
        productsCount: publishedProducts.length,
      };
    });

    return NextResponse.json({ ...data, data: filteredData }, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch packages" },
      { status },
    );
  }
}