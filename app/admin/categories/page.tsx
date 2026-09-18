"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import { AURELLE_CATEGORIES, CategoryDefinition } from "@/lib/categories/data";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  FolderTree,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDefinition[]>(AURELLE_CATEGORIES);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    // 1. Load permanently from server API (reads data/categories.json)
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories((prev) =>
          prev.map((cat) => {
            const matched = data.categories.find((c: { slug: string }) => c.slug === cat.slug);
            return matched && (matched.image_url || matched.image_public_id)
              ? { ...cat, image_url: matched.image_url, image_public_id: matched.image_public_id }
              : cat;
          })
        );
        return;
      }
    } catch {}

    // 2. Fallback to local store
    try {
      const saved = localStorage.getItem("aurelle_categories_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories((prev) =>
            prev.map((cat) => {
              const matched = parsed.find((p: { slug: string }) => p.slug === cat.slug);
              return matched ? { ...cat, ...matched } : cat;
            })
          );
        }
      }
    } catch {}
  }

  async function handleImageUpload(slug: string, asset: CloudinaryAsset) {
    setCategories((prev) => {
      const updated = prev.map((c) =>
        c.slug === slug
          ? { ...c, image_url: asset.secure_url, image_public_id: asset.public_id }
          : c
      );
      try {
        localStorage.setItem("aurelle_categories_data", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Save permanently to server filesystem
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          image_url: asset.secure_url,
          image_public_id: asset.public_id,
        }),
      });
    } catch {}

    // Also sync to Supabase if connected
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("categories")
        .update({
          image_url: asset.secure_url,
          image_public_id: asset.public_id,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", slug);
    } catch {}

    setMessage({
      text: "Category photo saved permanently & active on live store!",
      type: "success",
    });
  }

  async function handleRemoveImage(slug: string) {
    setCategories((prev) => {
      const updated = prev.map((c) =>
        c.slug === slug ? { ...c, image_url: null, image_public_id: null } : c
      );
      try {
        localStorage.setItem("aurelle_categories_data", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Save permanently to server filesystem
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          image_url: null,
          image_public_id: null,
        }),
      });
    } catch {}

    // Also sync to Supabase if connected
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("categories")
        .update({
          image_url: null,
          image_public_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", slug);
    } catch {}

    setMessage({ text: "Image removed.", type: "info" });
  }

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="Categories & Images"
        subtitle="Upload photos for your 10 storefront categories. Images automatically appear in the circular carousel."
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner notification */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : message.type === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Clean Info Bar */}
        <div className="bg-white p-4.5 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex items-center gap-3 text-[#1D211F]">
          <div className="w-9 h-9 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center shrink-0">
            <FolderTree size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1D211F]">
              10 Storefront Categories
            </p>
            <p className="text-[11px] text-[#5C6460]">
              Upload a square or circular image for each category. Changes save automatically and reflect immediately on your live store.
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((category) => {
            const isExpanded = expandedCat === category.slug;

            return (
              <div
                key={category.slug}
                className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs p-5 flex flex-col justify-between hover:border-[#183D2B]/40 transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#DCCFB9]/30 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold flex items-center justify-center">
                        #{category.sort_order}
                      </span>
                      <h2 className="text-base font-bold text-[#1D211F]">{category.name}</h2>
                    </div>
                    <Link
                      href={`/categories/${category.slug}`}
                      target="_blank"
                      className="text-xs text-[#5C6460] hover:text-[#183D2B] flex items-center gap-0.5"
                    >
                      <span>Preview</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  {/* Circular Image Uploader */}
                  <div className="mb-4">
                    <CloudinaryUploader
                      label="Category Photo"
                      description="Recommended: Square image"
                      aspectRatio="circle"
                      folder="aurelle/categories"
                      value={category.image_url}
                      publicId={category.image_public_id}
                      onUploadSuccess={(asset: CloudinaryAsset) =>
                        handleImageUpload(category.slug, asset)
                      }
                      onRemove={() => handleRemoveImage(category.slug)}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1 mb-3">
                    <label className="text-[10px] font-bold text-[#5C6460] uppercase tracking-wider">
                      Description
                    </label>
                    <p className="text-xs text-[#1D211F] leading-relaxed bg-[#F7F5EF] p-2.5 rounded-lg border border-[#DCCFB9]/40">
                      {category.description}
                    </p>
                  </div>

                  {/* Subcategories Accordion */}
                  <div className="border-t border-[#DCCFB9]/30 pt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedCat(isExpanded ? null : category.slug)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-[#5C6460] hover:text-[#183D2B] transition-colors"
                    >
                      <span>
                        Subcategories ({category.subcategories?.length || 0})
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && category.subcategories && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1">
                        {category.subcategories.map((sub) => (
                          <span
                            key={sub.slug}
                            className="px-2.5 py-1 text-[11px] font-medium bg-[#F7F5EF] text-[#1D211F] rounded-md border border-[#DCCFB9]/60"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
