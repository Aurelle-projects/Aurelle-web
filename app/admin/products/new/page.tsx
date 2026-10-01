"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import {
  Save,
  ArrowLeft,
  Check,
  AlertCircle,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

interface UploadedImage {
  public_id: string;
  secure_url: string;
  is_primary: boolean;
}

interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

interface DbSubcategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string;
}

interface DbBrand {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageToDelete, setImageToDelete] = useState<{ index: number; url: string; public_id?: string } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // DB option lists
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [dbAllSubs, setDbAllSubs] = useState<DbSubcategory[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    brand_id: "",
    category_id: "",
    subcategory_id: "",
    description: "",
    benefits: "",
    ingredients: "",
    usage_instructions: "",
    retail_price: "",
    compare_at_price: "",
    tax_enabled: true,
    wholesale_price: "",
    wholesale_unit_price: "",
    wholesale_unit_enabled: true,
    wholesale_box_enabled: false,
    wholesale_units_per_box: "24",
    wholesale_box_price: "",
    wholesale_custom_quantity_enabled: true,
    wholesale_moq: "12",
    is_published: true,
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: true,
    is_wholesale_available: true,
  });

  // Subcategories filtered by selected category
  const filteredSubs = dbAllSubs.filter((s) => s.parent_id === formData.category_id);

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const supabase = createClient();
        const [{ data: brands }, { data: cats }, { data: subs }] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("brands").select("id, name, slug").eq("is_active", true).order("name"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("categories").select("id, name, slug").is("parent_id", null).eq("is_active", true).order("sort_order"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("categories").select("id, name, slug, parent_id").not("parent_id", "is", null).eq("is_active", true).order("sort_order"),
        ]);
        if (brands) setDbBrands(brands);
        if (cats) {
          setDbCategories(cats);
          setFormData((prev) => ({ ...prev, category_id: cats[0]?.id ?? "" }));
        }
        if (subs) setDbAllSubs(subs);
      } catch {
        // silent
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const autoSlug = val.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").trim();
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
      sku: prev.sku === "" ? `AUR-${autoSlug.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}` : prev.sku,
    }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        // Clear subcategory when category changes
        if (name === "category_id") next.subcategory_id = "";
        return next;
      });
    }
  }

  function handleImageUploaded(asset: CloudinaryAsset) {
    setImages((prev) => [...prev, { public_id: asset.public_id, secure_url: asset.secure_url, is_primary: prev.length === 0 }]);
  }

  function setPrimaryImage(index: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_primary: i === index })));
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

  async function handleConfirmDeleteImage() {
    if (!imageToDelete) return;
    setIsDeletingImage(true);
    try {
      if (imageToDelete.public_id) {
        await fetch("/api/admin/upload/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: imageToDelete.public_id }),
        });
      }
      removeImage(imageToDelete.index);
      setImageToDelete(null);
    } catch (err) {
      console.error("Failed to delete image:", err);
      removeImage(imageToDelete.index);
      setImageToDelete(null);
    } finally {
      setIsDeletingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) { setMessage({ text: "Product title is required.", type: "error" }); return; }
    if (!formData.retail_price || isNaN(Number(formData.retail_price))) { setMessage({ text: "Valid retail price in AED is required.", type: "error" }); return; }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, images }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setMessage({ text: result.error || "Failed to save product. Check server logs.", type: "error" });
        return;
      }
    } catch (err: any) {
      setMessage({ text: err?.message || "Network error. Could not reach the server.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  const boxUnitsPerBox = parseInt(formData.wholesale_units_per_box, 10) || 0;
  const boxUnitPrice = parseFloat(formData.wholesale_unit_price || formData.wholesale_price) || 0;
  const boxConfiguredPrice = parseFloat(formData.wholesale_box_price) || 0;
  const boxCalcValue = boxUnitsPerBox > 0 && boxUnitPrice > 0 ? boxUnitsPerBox * boxUnitPrice : 0;
  const boxCalcDiff = Math.abs(boxConfiguredPrice - boxCalcValue);
  const boxCalcPct = boxCalcValue > 0 ? Math.round((boxCalcDiff / boxCalcValue) * 100) : 0;

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Add New Product"
        subtitle="Create an e-commerce product with Cloudinary multi-images, pricing, and wholesale MOQ."
      />

      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C6460] hover:text-[#183D2B] transition-colors">
            <ArrowLeft size={15} />
            <span>Back to Products Catalog</span>
          </Link>
          <button type="button" onClick={handleSubmit} disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSaving ? "Publishing..." : "Publish Product"}</span>
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
            message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"
          }`}>
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column: Details & Media ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">Basic Information</h2>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">Product Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleNameChange} required
                  placeholder="e.g. Velvet Matte Silk Lipstick"
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">URL Slug</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-mono text-[#1D211F] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">SKU Code</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-mono text-[#1D211F] outline-none" />
                </div>
              </div>

              {/* Brand / Category / Subcategory */}
              {loadingOptions ? (
                <div className="flex items-center gap-2 text-xs text-[#5C6460] py-2">
                  <Loader2 size={14} className="animate-spin" />
                  Loading brands and categories from database...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">Brand</label>
                    <select name="brand_id" value={formData.brand_id} onChange={handleChange}
                      className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer">
                      <option value="">No brand</option>
                      {dbBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">Category *</label>
                    <select name="category_id" value={formData.category_id} onChange={handleChange}
                      className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer">
                      <option value="">Select category...</option>
                      {dbCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">Subcategory</label>
                    <select name="subcategory_id" value={formData.subcategory_id} onChange={handleChange}
                      disabled={!formData.category_id || filteredSubs.length === 0}
                      className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">
                        {!formData.category_id ? "Select a category first" : filteredSubs.length === 0 ? "No subcategories" : "Select subcategory..."}
                      </option>
                      {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">Detailed Description</label>
                <textarea name="description" rows={4} value={formData.description} onChange={handleChange}
                  placeholder="Provide an editorial, elevated description of the product, textures, feel, and results..."
                  className="w-full p-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">Ingredients (INCI)</label>
                  <textarea name="ingredients" rows={3} value={formData.ingredients} onChange={handleChange}
                    placeholder="Aqua, Niacinamide, Glycerin..."
                    className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">How To Use</label>
                  <textarea name="usage_instructions" rows={3} value={formData.usage_instructions} onChange={handleChange}
                    placeholder="Massage 2-3 drops into cleansed skin..."
                    className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* Cloudinary Multi-Image Upload */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">Product Photography</h2>
              <CloudinaryUploader
                label="Add Image to Gallery"
                description="Upload high-res product photos (automatically optimized to WebP)"
                folder="aurelle/products"
                aspectRatio="square"
                onUploadSuccess={handleImageUploaded}
              />
              {images.length > 0 && (
                <div className="pt-3 border-t border-[#DCCFB9]/30">
                  <p className="text-xs font-bold text-[#5C6460] uppercase tracking-wider mb-3">Gallery Images ({images.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={img.public_id} className={`relative rounded-lg overflow-hidden border-2 bg-neutral-100 ${img.is_primary ? "border-[#183D2B]" : "border-[#DCCFB9]"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.secure_url} alt="Product thumbnail" className="w-full h-28 object-cover" />
                        {img.is_primary && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-[#183D2B] text-white rounded">PRIMARY</span>
                        )}
                        <div className="p-1.5 bg-white flex items-center justify-between">
                          {!img.is_primary && (
                            <button type="button" onClick={() => setPrimaryImage(idx)}
                              className="text-[10px] font-bold text-[#183D2B] hover:underline flex items-center gap-0.5">
                              <Star size={10} /><span>Set Primary</span>
                            </button>
                          )}
                          <button type="button" onClick={() => setImageToDelete({ index: idx, url: img.secure_url, public_id: img.public_id })}
                            className="text-red-600 hover:text-red-800 ml-auto p-0.5" title="Remove image">
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

          {/* ── Right Column: Pricing, Stock, Badges ──────────────────────── */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">Pricing & Wholesale</h2>
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">Retail Price (AED) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C6460]">AED</span>
                  <input type="number" step="0.01" name="retail_price" value={formData.retail_price} onChange={handleChange} required placeholder="120.00"
                    className="w-full h-10 pl-14 pr-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm font-bold text-[#183D2B] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">Compare At Price (AED)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C6460]">AED</span>
                  <input type="number" step="0.01" name="compare_at_price" value={formData.compare_at_price} onChange={handleChange} placeholder="150.00"
                    className="w-full h-10 pl-14 pr-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#5C6460] outline-none" />
                </div>
              </div>

              {/* Retail Tax Toggle */}
              <div className="pt-2 border-t border-[#DCCFB9]/40">
                <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-lg border border-[#EFEAE0]">
                  <div>
                    <label htmlFor="tax_enabled_toggle" className="text-xs font-bold text-[#1D211F] block cursor-pointer">Retail Tax (5% VAT)</label>
                    <p className="text-[11px] text-[#5C6460] mt-0.5">
                      {formData.tax_enabled
                        ? "5% retail tax applies to this product."
                        : "This product is tax-exempt for retail."}
                    </p>
                    <p className="text-[10px] text-[#8E9590] mt-0.5 italic">
                      Applies to RETAIL only. Does not affect wholesale pricing.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      id="tax_enabled_toggle"
                      type="checkbox"
                      name="tax_enabled"
                      checked={formData.tax_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#DCCFB9] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#183D2B]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Wholesale Selling Configuration */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCCFB9]/30 pb-2">
                <h2 className="text-sm font-bold text-[#183D2B] uppercase tracking-wider">Wholesale Selling Configuration</h2>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#183D2B]">
                  <input
                    type="checkbox"
                    name="is_wholesale_available"
                    checked={formData.is_wholesale_available}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                  />
                  <span>Enable B2B Wholesale</span>
                </label>
              </div>

              {formData.is_wholesale_available ? (
                <div className="space-y-4 pt-1">
                  {/* Single Unit Option */}
                  <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#EFEAE0] space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#14231B]">
                      <input
                        type="checkbox"
                        name="wholesale_unit_enabled"
                        checked={formData.wholesale_unit_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                      />
                      <span>Sell by Single Unit / Piece</span>
                    </label>

                    {formData.wholesale_unit_enabled && (
                      <div>
                        <label className="block text-[11px] font-bold text-[#5C6460] uppercase mb-1">Wholesale Unit Price (AED)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E9590]">AED</span>
                          <input
                            type="number"
                            step="0.01"
                            name="wholesale_unit_price"
                            value={formData.wholesale_unit_price || formData.wholesale_price}
                            onChange={(e) => {
                              handleChange(e);
                              setFormData((prev) => ({ ...prev, wholesale_price: e.target.value }));
                            }}
                            placeholder="15.00"
                            className="w-full h-9 pl-12 pr-3 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#183D2B] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full Box Option */}
                  <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#EFEAE0] space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#14231B]">
                      <input
                        type="checkbox"
                        name="wholesale_box_enabled"
                        checked={formData.wholesale_box_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                      />
                      <span>Sell by Full Box / Carton</span>
                    </label>

                    {formData.wholesale_box_enabled && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#5C6460] uppercase mb-1">Units Per Box</label>
                            <input
                              type="number"
                              min="1"
                              name="wholesale_units_per_box"
                              value={formData.wholesale_units_per_box}
                              onChange={handleChange}
                              placeholder="24"
                              className="w-full h-9 px-3 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#14231B] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#5C6460] uppercase mb-1">Wholesale Box Price (AED)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E9590]">AED</span>
                              <input
                                type="number"
                                step="0.01"
                                name="wholesale_box_price"
                                value={formData.wholesale_box_price}
                                onChange={handleChange}
                                placeholder="320.00"
                                className="w-full h-9 pl-12 pr-3 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#183D2B] outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Box Pricing Calculation UX Helper */}
                        {boxCalcValue > 0 && (
                          <div className="mt-3 p-3 bg-white border border-[#DCCFB9] rounded-md space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[#5C6460]">
                              <span>Calculated Unit Value (1 Box):</span>
                              <span className="font-bold text-[#14231B]">
                                {boxUnitsPerBox} pcs × AED {boxUnitPrice} = AED {boxCalcValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            {boxConfiguredPrice > 0 && (
                              <div className="text-[11px] font-semibold">
                                {boxConfiguredPrice < boxCalcValue && (
                                  <p className="text-emerald-700">
                                    Box saving: AED {boxCalcDiff.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({boxCalcPct}% lower than unit-value pricing)
                                  </p>
                                )}
                                {boxConfiguredPrice === boxCalcValue && (
                                  <p className="text-[#5C6460]">Same as unit-value pricing</p>
                                )}
                                {boxConfiguredPrice > boxCalcValue && (
                                  <p className="text-amber-700">
                                    AED {boxCalcDiff.toLocaleString("en-US", { minimumFractionDigits: 2 })} higher than unit-value pricing
                                  </p>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  wholesale_box_price: boxCalcValue.toFixed(2),
                                }));
                              }}
                              className="text-[11px] font-bold text-[#183D2B] underline hover:text-[#102D20] cursor-pointer"
                            >
                              Use Calculated Price (AED {boxCalcValue.toFixed(2)})
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* MOQ */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">Default Wholesale Minimum Order Qty (MOQ)</label>
                    <input
                      type="number"
                      name="wholesale_moq"
                      value={formData.wholesale_moq}
                      onChange={handleChange}
                      className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-bold text-[#1D211F] outline-none"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8E9590] italic">Wholesale ordering is disabled for this product.</p>
              )}
            </div>

            {/* Badges & Status */}
            <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">Storefront Badges</h2>
              {([
                ["is_published", "Published (Visible to Customers)"],
                ["is_new_arrival", "New Arrival Badge"],
                ["is_best_seller", "Best Seller Badge"],
                ["is_featured", "Featured on Homepage"],
                ["is_wholesale_available", "B2B Wholesale Available"],
              ] as [keyof typeof formData, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#1D211F]">
                  <input type="checkbox" name={key} checked={formData[key] as boolean} onChange={handleChange}
                    className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Delete Image Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(imageToDelete)}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleConfirmDeleteImage}
        itemType="image"
        itemName="Product Gallery Image"
        imagePreview={imageToDelete?.url}
        description="Are you sure you want to remove this image? It will be permanently removed from Cloudinary storage."
        isLoading={isDeletingImage}
      />
    </div>
  );
}
