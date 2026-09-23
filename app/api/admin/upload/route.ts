import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary/server";
import { compressImageForUpload } from "@/lib/images/compress";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
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

    // Max file size: 2MB
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum upload limit of 2MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

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

    const asset = await uploadToCloudinary(compressed.buffer, folder, {
      format: "webp",
    });

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
