import sharp from "sharp";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  initialQuality?: number;
  maxSizeBytes?: number;
}

export interface CompressedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

/**
 * Compresses and resizes an image buffer before uploading to storage.
 *
 * Requirements:
 * - Maximum image dimensions: 1600 × 1600 px
 * - Image quality: 80–85%
 * - Target compressed file size: 300 KB – 800 KB
 * - Format: WebP
 */
export async function compressImageForUpload(
  inputBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const maxSizeBytes = options.maxSizeBytes ?? 800 * 1024; // 800 KB
  let quality = options.initialQuality ?? 82; // 80–85% range

  // 1. Initial pass: rotate according to EXIF orientation, resize to fit within 1600x1600, convert to WebP
  let result = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  // 2. If compressed size exceeds 800 KB, adjust quality to 80%
  if (result.info.size > maxSizeBytes && quality > 80) {
    quality = 80;
    result = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 5 })
      .toBuffer({ resolveWithObject: true });
  }

  // 3. If still above 800 KB (very complex image with noise/grain), iteratively scale dimensions slightly
  let currentWidth = maxWidth;
  let currentHeight = maxHeight;
  while (result.info.size > maxSizeBytes && currentWidth > 900) {
    currentWidth = Math.round(currentWidth * 0.9);
    currentHeight = Math.round(currentHeight * 0.9);
    result = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: currentWidth,
        height: currentHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 5 })
      .toBuffer({ resolveWithObject: true });
  }

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    size: result.info.size,
    format: result.info.format,
  };
}
