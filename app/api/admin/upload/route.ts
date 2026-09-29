import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary/server";
import { compressImageForUpload } from "@/lib/images/compress";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "aurelle/general";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in form data" },
        { status: 400 }
      );
    }

    // Verify file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are accepted" },
        { status: 400 }
      );
    }

    // Prevent upload if original image exceeds 4 MB limit
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size exceeds 4 MB limit. Please upload an image under 4 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    let uploadBuffer: Buffer = rawBuffer;
    let uploadOptions: Record<string, unknown> = {};

    // If the uploaded image size is more than 2 MB, automatically compress the image
    const COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // 2 MB
    if (file.size > COMPRESSION_THRESHOLD) {
      // Compress and resize image before uploading to storage:
      // - Maximum dimensions: 1600 × 1600 px
      // - Format: WebP
      // - Quality: 80–85%
      // - Target compressed size: 300 KB – 800 KB
      const compressed = await compressImageForUpload(rawBuffer, {
        maxWidth: 1600,
        maxHeight: 1600,
        initialQuality: 82,
        maxSizeBytes: 800 * 1024,
      });
      uploadBuffer = compressed.buffer;
      uploadOptions = { format: "webp" };
    }

    const asset = await uploadToCloudinary(uploadBuffer, folder, uploadOptions);

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload to Cloudinary failed";
    console.error("[Admin Upload Error]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
