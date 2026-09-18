import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    // Clear admin session cookie
    response.cookies.set("aurelle_admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
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
