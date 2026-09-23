"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

export interface CloudinaryAsset {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface CloudinaryUploaderProps {
  label?: string;
  description?: string;
  folder?: string;
  value?: string | null;
  publicId?: string | null;
  onUploadSuccess: (asset: CloudinaryAsset) => void;
  onRemove?: () => void;
  aspectRatio?: "circle" | "square" | "wide" | "hero";
  className?: string;
}

export default function CloudinaryUploader({
  label = "Upload Image",
  description = "PNG, JPG, WEBP up to 2MB (Auto-compressed to WebP)",
  folder = "aurelle/categories",
  value,
  publicId,
  onUploadSuccess,
  onRemove,
  aspectRatio = "square",
  className = "",
}: CloudinaryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit. Please choose an image up to 2MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      onUploadSuccess(data.asset);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    if (publicId) {
      try {
        await fetch("/api/admin/upload/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: publicId }),
        });
      } catch (err) {
        console.error("Failed to delete asset:", err);
      }
    }
    if (onRemove) onRemove();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const getAspectClass = () => {
    switch (aspectRatio) {
      case "circle":
        return "w-32 h-32 rounded-full mx-auto";
      case "hero":
        return "w-full h-48 rounded-xl";
      case "wide":
        return "w-full h-36 rounded-xl";
      default:
        return "w-full h-32 rounded-xl";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {value ? (
        <div className={`relative group overflow-hidden border border-[#DCCFB9] bg-neutral-100 shadow-xs ${getAspectClass()}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-full object-cover"
          />

          {/* Overlay controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                Saved
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 bg-white text-[#1D211F] hover:bg-neutral-100 rounded text-xs font-bold shadow-sm transition-colors"
              >
                Change Image
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  aria-label="Remove image"
                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded shadow-sm transition-colors"
                  title="Remove image"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={`relative border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-[#183D2B] bg-emerald-50/60"
              : "border-[#DCCFB9] hover:border-[#183D2B] bg-[#F7F5EF]/60 hover:bg-[#F7F5EF]"
          } ${getAspectClass()}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={26} className="animate-spin text-[#183D2B]" />
              <p className="text-xs font-semibold text-[#183D2B]">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white text-[#183D2B] flex items-center justify-center shadow-xs border border-[#DCCFB9]/50">
                <UploadCloud size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1D211F]">
                  Click or drag image here
                </p>
                {description && (
                  <p className="text-[11px] text-[#5C6460] mt-0.5 max-w-[220px] leading-tight">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
