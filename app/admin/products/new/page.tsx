"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";
import {
  Save,
  ArrowLeft,
  Check,
  AlertCircle,
  Trash2,
  Star,
} from "lucide-react";

interface UploadedImage {
  public_id: string;
  secure_url: string;
  is_primary: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    category_slug: AURELLE_CATEGORIES[0]?.slug ?? "cosmetics-makeup",
    subcategory_slug: "",
    description: "",
    benefits: "",
    ingredients: "",
    usage_instructions: "",
    retail_price: "",
    compare_at_price: "",
    wholesale_price: "",
    wholesale_moq: "12",
    stock_quantity: "50",
    low_stock_threshold: "5",
    is_published: true,
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: true,
    is_wholesale_available: true,
  });

  const [images, setImages] = useState<UploadedImage[]>([]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
      sku: prev.sku === "" ? `AUR-${autoSlug.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}` : prev.sku,
    }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleImageUploaded(asset: CloudinaryAsset) {
    setImages((prev) => [
      ...prev,
      {
        public_id: asset.public_id,
        secure_url: asset.secure_url,
        is_primary: prev.length === 0,
      },
    ]);
  }

  function setPrimaryImage(index: number) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_primary: i === index }))
    );
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.is_primary) && filtered[0]) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  }

  const currentCategory = AURELLE_CATEGORIES.find((c) => c.slug === formData.category_slug);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ text: "Product title is required.", type: "error" });
      return;
    }
    if (!formData.retail_price || isNaN(Number(formData.retail_price))) {
      setMessage({ text: "Valid retail price in AED is required.", type: "error" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setMessage({
          text: result.error || "Failed to save product. Check server logs.",
          type: "error",
        });
        return;
      }

      setMessage({ text: "Product published successfully to catalog!", type: "success" });
      setTimeout(() => router.push("/admin/products"), 1200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({
        text: err?.message || "Network error. Could not reach the server.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Add New Product"
        subtitle="Create an e-commerce product with Cloudinary multi-images, pricing, and wholesale MOQ."
      />

      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C6460] hover:text-[#183D2B] transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to Products Catalog</span>
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <Save size={16} />
            <span>{isSaving ? "Publishing..." : "Publish Product"}</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column (2 Cols): Details & Media ───────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                Basic Information
              </h2>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  placeholder="e.g. Velvet Matte Silk Lipstick"
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-mono text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-mono text-[#1D211F] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    name="category_slug"
                    value={formData.category_slug}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
                  >
                    {AURELLE_CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Subcategory
                  </label>
                  <select
                    name="subcategory_slug"
                    value={formData.subcategory_slug}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
                  >
                    <option value="">Select subcategory...</option>
                    {currentCategory?.subcategories.map((sub) => (
                      <option key={sub.slug} value={sub.slug}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide an editorial, elevated description of the product, textures, feel, and results..."
                  className="w-full p-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Ingredients (INCI)
                  </label>
                  <textarea
                    name="ingredients"
                    rows={3}
                    value={formData.ingredients}
                    onChange={handleChange}
                    placeholder="Aqua, Niacinamide, Glycerin..."
                    className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    How To Use
                  </label>
                  <textarea
                    name="usage_instructions"
                    rows={3}
                    value={formData.usage_instructions}
                    onChange={handleChange}
                    placeholder="Massage 2-3 drops into cleansed skin..."
                    className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary Multi-Image Upload */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                Product Photography (Cloudinary)
              </h2>

              <CloudinaryUploader
                label="Add Image to Gallery"
                description="Upload high-res product photos (automatically optimized to WebP)"
                folder="aurelle/products"
                aspectRatio="square"
                onUploadSuccess={handleImageUploaded}
              />

              {images.length > 0 && (
                <div className="pt-3 border-t border-[#DCCFB9]/30">
                  <p className="text-xs font-bold text-[#5C6460] uppercase tracking-wider mb-3">
                    Gallery Images ({images.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.public_id}
                        className={`relative rounded-lg overflow-hidden border-2 bg-neutral-100 ${
                          img.is_primary ? "border-[#183D2B]" : "border-[#DCCFB9]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.secure_url}
                          alt="Product thumbnail"
                          className="w-full h-28 object-cover"
                        />

                        {img.is_primary && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-[#183D2B] text-white rounded">
                            PRIMARY
                          </span>
                        )}

                        <div className="p-1.5 bg-white flex items-center justify-between">
                          {!img.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(idx)}
                              className="text-[10px] font-bold text-[#183D2B] hover:underline flex items-center gap-0.5"
                            >
                              <Star size={10} />
                              <span>Set Primary</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="text-red-600 hover:text-red-800 ml-auto p-0.5"
                            title="Remove image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column (1 Col): Pricing, Stock, Badges ────────────── */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                Pricing & Wholesale
              </h2>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Retail Price (AED) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C6460]">AED</span>
                  <input
                    type="number"
                    step="0.01"
                    name="retail_price"
                    value={formData.retail_price}
                    onChange={handleChange}
                    required
                    placeholder="120.00"
                    className="w-full h-10 pl-14 pr-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm font-bold text-[#183D2B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Compare At Price (AED)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C6460]">AED</span>
                  <input
                    type="number"
                    step="0.01"
                    name="compare_at_price"
                    value={formData.compare_at_price}
                    onChange={handleChange}
                    placeholder="150.00"
                    className="w-full h-10 pl-14 pr-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#5C6460] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#DCCFB9]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C]">B2B Wholesale</span>
                  <span className="text-[10px] text-[#5C6460]">For licensed trade</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase mb-1">
                    Wholesale Price (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="wholesale_price"
                    value={formData.wholesale_price}
                    onChange={handleChange}
                    placeholder="65.00"
                    className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#C9A84C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase mb-1">
                    Wholesale Minimum Order (MOQ)
                  </label>
                  <input
                    type="number"
                    name="wholesale_moq"
                    value={formData.wholesale_moq}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                Inventory
              </h2>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Stock Units
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Low Stock Alert Level
                </label>
                <input
                  type="number"
                  name="low_stock_threshold"
                  value={formData.low_stock_threshold}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                />
              </div>
            </div>

            {/* Badges & Status */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                Storefront Badges
              </h2>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#1D211F]">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                />
                <span>Published (Visible to Customers)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#1D211F]">
                <input
                  type="checkbox"
                  name="is_new_arrival"
                  checked={formData.is_new_arrival}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                />
                <span>New Arrival Badge</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#1D211F]">
                <input
                  type="checkbox"
                  name="is_best_seller"
                  checked={formData.is_best_seller}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                />
                <span>Best Seller Badge</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#1D211F]">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                />
                <span>Featured on Homepage</span>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
