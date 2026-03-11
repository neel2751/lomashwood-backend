import { type NextRequest, NextResponse } from "next/server";

import { loginAdmin } from "@servers/auth.actions";
import { parseZodError } from "@servers/_shared";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await loginAdmin(body);

    const response = NextResponse.json(data, { status: 200 });
    response.cookies.set("lw_access_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    const status = error?.status ?? 401;
    return NextResponse.json(
      { message: parseZodError(error) || "Login failed" },
      { status }
    );
  }
}
