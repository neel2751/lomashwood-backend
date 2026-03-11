import { type NextRequest, NextResponse } from "next/server";

import { deleteProductOption, getProductOptionById, updateProductOption } from "@servers/product-options.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getProductOptionById("style", params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch style" },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = await updateProductOption("style", params.id, body);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to update style" },
      { status }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await deleteProductOption("style", params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to delete style" },
      { status }
    );
  }
}
