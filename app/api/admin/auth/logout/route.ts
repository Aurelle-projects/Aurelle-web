import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminCookieOptions } from "@/lib/auth/adminSession";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    // Clear admin session cookie
    response.cookies.set(ADMIN_COOKIE_NAME, "", {
      ...getAdminCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[Admin Auth Logout Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout." },
      { status: 500 }
    );
  }
}
