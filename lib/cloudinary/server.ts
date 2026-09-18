// ============================================================
// AURELLE — CLOUDINARY SERVER SDK INITIALIZATION
// ⚠️  SERVER ONLY — Uses API Secret. Never import on client.
// ============================================================

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { cloudinaryConfig, validateCloudinaryConfig } from "./config";

let isConfigured = false;

export function getCloudinary() {
  if (!isConfigured) {
    validateCloudinaryConfig();
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
      secure: true,
    });
    isConfigured = true;
  }
  return cloudinary;
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a file Buffer directly to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "aurelle/general",
  options: Record<string, unknown> = {}
): Promise<UploadResult> {
  const cld = getCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        quality: "auto",
        fetch_format: "auto",
        ...options,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed with no result"));
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image asset by public_id
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const cld = getCloudinary();
  try {
    const res = await cld.uploader.destroy(publicId);
    return res.result === "ok" || res.result === "not found";
  } catch (err) {
    console.error("Cloudinary deletion failed:", err);
    return false;
  }
}
