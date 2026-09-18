import { NextRequest, NextResponse } from "next/server";
import { deleteFromCloudinary } from "@/lib/cloudinary/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json(
        { error: "Missing public_id parameter" },
        { status: 400 }
      );
    }

    const success = await deleteFromCloudinary(public_id);

    return NextResponse.json({ success });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Deletion failed";
    console.error("[Admin Cloudinary Delete Error]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
