import { type NextRequest, NextResponse } from "next/server";

import { listProducts } from "@servers/products.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const data = await listProducts({ ...query, isPublished: "true" });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch products" },
      { status },
    );
  }
}