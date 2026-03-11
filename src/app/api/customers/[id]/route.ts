import { type NextRequest, NextResponse } from "next/server";

import { deleteCustomer, getCustomerById, updateCustomer } from "@servers/customers.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getCustomerById(params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to fetch customer" },
      { status }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const data = await updateCustomer(params.id, body);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to update customer" },
      { status }
    );
  }
}

export const PUT = PATCH;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCustomer(params.id);

    return NextResponse.json({ message: "Customer deleted" }, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return NextResponse.json(
      { message: parseZodError(error) || "Failed to delete customer" },
      { status }
    );
  }
}