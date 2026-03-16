import { type NextRequest, NextResponse } from "next/server";

import { listProductOptions } from "@servers/product-options.actions";
import { parseZodError, searchParamsToQuery } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParamsToQuery(searchParams);
    const data = await listProductOptions("style", { ...query, isActive: "true" });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch styles" },
      { status },
    );
  }
}
