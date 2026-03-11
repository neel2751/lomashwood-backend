import { type NextRequest, NextResponse } from "next/server";

import { getAdminFromAccessToken } from "@servers/auth.actions";
import { parseZodError } from "@servers/_shared";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("lw_access_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const user = await getAdminFromAccessToken(token);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    const status = error?.status ?? 401;
    return NextResponse.json(
      { message: parseZodError(error) || "Unauthenticated" },
      { status }
    );
  }
}
