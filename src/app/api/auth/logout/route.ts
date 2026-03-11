import { type NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
    response.cookies.delete("lw_access_token");
    response.cookies.delete("lw_refresh_token");
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Logout failed" },
      { status: 500 }
    );
  }
}
