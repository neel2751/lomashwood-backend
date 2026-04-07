import { type NextRequest, NextResponse } from "next/server";

import { createProduct, listProducts } from "@servers/products.actions";
import { logApiRouteError } from "@servers/_api-logger";
import { parseZodError, searchParamsToQuery } from "@servers/_shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listProducts(searchParamsToQuery(searchParams));

    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    const requestId = logApiRouteError({
      request: req,
      route: "/api/products",
      operation: "listProducts",
      error,
    });
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch products", requestId },
      { status, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await createProduct(body);

    return NextResponse.json(data, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    const requestId = logApiRouteError({
      request: req,
      route: "/api/products",
      operation: "createProduct",
      error,
    });
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to create product", requestId },
      { status, headers: NO_STORE_HEADERS },
    );
  }
}
