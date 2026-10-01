"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import {
  Save,
  ArrowLeft,
  Check,
  AlertCircle,
  Trash2,
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Percent,
  Package,
  X,
  Loader2,
  DollarSign,
  Tag,
  Eye,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ComboOffer, ComboOfferImage } from "@/types/combo";
import { getProductStockQuantity, calculateComboAvailability } from "@/lib/products/inventory";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  slug: string;
  retail_price: number;
  category_name?: string;
  category_id?: string;
  subcategory_id?: string;
  brand_name?: string;
  brand_id?: string;
  status?: string;
  is_published?: boolean;
  stock_quantity?: number;
  image_url?: string;
}

interface SelectedComponent {
  product_id: string;
  quantity: number;
  sort_order: number;
  product: ProductOption;
}

interface ComboFormProps {
  initialData?: ComboOffer | null;
  isEdit?: boolean;
}

export default function ComboForm({ initialData, isEdit = false }: ComboFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form Fields
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [features, setFeatures] = useState<string[]>(
    Array.isArray(initialData?.features)
      ? initialData.features
      : typeof initialData?.features === "string"
      ? (initialData.features as string).split("\n").filter(Boolean)
      : ["Complete skincare regimen", "Saves time & money", "Dermatologically tested"]
  );
  const [newFeatureText, setNewFeatureText] = useState("");

  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialData?.compare_at_price ? String(initialData.compare_at_price) : ""
  );
  const [taxEnabled, setTaxEnabled] = useState(
    initialData?.tax_enabled !== undefined ? initialData.tax_enabled : true
  );
  const [isActive, setIsActive] = useState(
    initialData?.is_active !== undefined ? initialData.is_active : true
  );
  const [isFeatured, setIsFeatured] = useState(
    initialData?.is_featured !== undefined ? initialData.is_featured : false
  );

  // Media
  const [primaryImage, setPrimaryImage] = useState<{ url: string; public_id?: string } | null>(
    initialData?.primary_image_url
      ? {
          url: initialData.primary_image_url,
          public_id: initialData.primary_image_public_id || undefined,
        }
      : null
  );
  const [galleryImages, setGalleryImages] = useState<ComboOfferImage[]>(
    Array.isArray(initialData?.images) ? initialData.images : []
  );

  // Selected Components
  const [components, setComponents] = useState<SelectedComponent[]>([]);

  // Catalog Products & Selector Modal
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Selector filters
  const [selectorSearch, setSelectorSearch] = useState("");
  const [selectorCategory, setSelectorCategory] = useState("all");
  const [selectorBrand, setSelectorBrand] = useState("all");
  const [selectorStatus, setSelectorStatus] = useState("all");
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set());

  // Filter Categories & Brands list
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  // Auto-generate slug and SKU from Name on create
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
    if (!isEdit && (!sku || sku.startsWith("AUR-CMB-"))) {
      const cleanPart = val
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "")
        .slice(0, 4);
      setSku(`AUR-CMB-${cleanPart || "001"}`);
    }
  };

  // Load Catalog Products, Categories, Brands
  useEffect(() => {
    async function loadCatalog() {
      setLoadingProducts(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;

        const [{ data: prods }, { data: cats }, { data: brs }] = await Promise.all([
          supabase
            .from("products")
            .select(`
              id, name, sku, slug, retail_price, status, is_published,
              category_id, subcategory_id, brand_id,
              categories ( id, name ),
              brands ( id, name ),
              product_images ( secure_url, is_primary ),
              inventory ( stock_quantity )
            `)
            .order("name", { ascending: true }),
          supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
          supabase.from("brands").select("id, name").eq("is_active", true).order("name"),
        ]);

        if (cats) setCategories(cats);
        if (brs) setBrands(brs);

        if (prods) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: ProductOption[] = prods.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            slug: p.slug,
            retail_price: Number(p.retail_price) || 0,
            category_id: p.category_id,
            category_name: p.categories?.name || "General",
            brand_id: p.brand_id,
            brand_name: p.brands?.name || "Aurelle",
            status: p.status,
            is_published: p.is_published,
            stock_quantity: getProductStockQuantity(p.inventory),
            image_url:
              p.product_images?.find((img: any) => img.is_primary)?.secure_url ||
              p.product_images?.[0]?.secure_url ||
              null,
          }));
          setAllProducts(mapped);

          // If editing or initialData provided with items
          if (initialData?.items && initialData.items.length > 0) {
            const initialComponents: SelectedComponent[] = initialData.items.map((it, idx) => {
              const matchedProd = mapped.find((p) => p.id === it.product_id) || {
                id: it.product_id,
                name: it.product?.name || "Product",
                sku: it.product?.sku || "AUR-PROD",
                slug: it.product?.slug || "",
                retail_price: Number(it.product?.retail_price) || 0,
                category_name: it.product?.category?.name,
                brand_name: it.product?.brand?.name,
                image_url: it.product?.product_images?.[0]?.secure_url,
                stock_quantity: getProductStockQuantity(it.product?.inventory),
              };
              return {
                product_id: it.product_id,
                quantity: it.quantity,
                sort_order: it.sort_order ?? idx,
                product: matchedProd,
              };
            });
            setComponents(initialComponents);
          }
        }
      } catch (err) {
        console.error("[ComboForm] Failed to load catalog:", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadCatalog();
  }, [initialData]);

  // Product Selector Modal Filtering
  const filteredCatalog = useMemo(() => {
    return allProducts.filter((p) => {
      const term = selectorSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term);

      const matchesCat =
        selectorCategory === "all" || p.category_id === selectorCategory || p.category_name === selectorCategory;

      const matchesBrand =
        selectorBrand === "all" || p.brand_id === selectorBrand || p.brand_name === selectorBrand;

      const matchesStatus =
        selectorStatus === "all" ||
        (selectorStatus === "published" && p.is_published) ||
        (selectorStatus === "instock" && (p.stock_quantity ?? 0) > 0);

      return matchesSearch && matchesCat && matchesBrand && matchesStatus;
    });
  }, [allProducts, selectorSearch, selectorCategory, selectorBrand, selectorStatus]);

  // Open Selector Modal
  const handleOpenSelector = () => {
    const currentIds = new Set(components.map((c) => c.product_id));
    setTempSelectedIds(currentIds);
    setIsSelectorOpen(true);
  };

  // Toggle selection in modal
  const handleToggleProductInModal = (prodId: string) => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(prodId)) {
        next.delete(prodId);
      } else {
        next.add(prodId);
      }
      return next;
    });
  };

  // Confirm selection from modal
  const handleConfirmProductSelection = () => {
    const existingMap = new Map(components.map((c) => [c.product_id, c]));
    const updatedComponents: SelectedComponent[] = [];

    // Keep previously selected products that are still checked
    tempSelectedIds.forEach((id) => {
      if (existingMap.has(id)) {
        updatedComponents.push(existingMap.get(id)!);
      } else {
        const prod = allProducts.find((p) => p.id === id);
        if (prod) {
          updatedComponents.push({
            product_id: prod.id,
            quantity: 1,
            sort_order: updatedComponents.length,
            product: prod,
          });
        }
      }
    });

    setComponents(updatedComponents);
    setIsSelectorOpen(false);
  };

  // Component Actions
  const handleUpdateComponentQty = (productId: string, qty: number) => {
    const cleanQty = Math.max(1, Math.floor(qty));
    setComponents((prev) =>
      prev.map((c) => (c.product_id === productId ? { ...c, quantity: cleanQty } : c))
    );
  };

  const handleRemoveComponent = (productId: string) => {
    setComponents((prev) => prev.filter((c) => c.product_id !== productId));
  };

  const handleMoveComponent = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === components.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const next = [...components];
    const itemA = next[index];
    const itemB = next[targetIdx];
    if (itemA && itemB) {
      next[index] = itemB;
      next[targetIdx] = itemA;
      next.forEach((item, idx) => {
        item.sort_order = idx;
      });
      setComponents(next);
    }
  };

  // Pricing & Stock Reference UX Computations
  const individualTotalValue = useMemo(() => {
    return components.reduce((sum, c) => {
      return sum + (Number(c.product.retail_price) || 0) * c.quantity;
    }, 0);
  }, [components]);

  const comboStockCalc = useMemo(() => {
    return calculateComboAvailability(
      components.map((c) => ({
        quantity: c.quantity,
        product_id: c.product_id,
        product: {
          id: c.product.id,
          name: c.product.name,
          sku: c.product.sku,
          status: c.product.status,
          is_published: c.product.is_published,
          inventory: { stock_quantity: c.product.stock_quantity ?? 0 },
        },
      }))
    );
  }, [components]);

  const numComboPrice = Number(price) || 0;
  const savingsAmount = Math.max(0, individualTotalValue - numComboPrice);
  const savingsPercent =
    individualTotalValue > 0 ? Math.round((savingsAmount / individualTotalValue) * 100) : 0;

  // Features List Actions
  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setFeatures((prev) => [...prev, newFeatureText.trim()]);
      setNewFeatureText("");
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Form Validations
    if (!name.trim()) {
      setMessage({ text: "Combo name is required.", type: "error" });
      return;
    }
    if (!sku.trim()) {
      setMessage({ text: "SKU is required.", type: "error" });
      return;
    }
    if (!slug.trim()) {
      setMessage({ text: "URL Slug is required.", type: "error" });
      return;
    }
    if (numComboPrice <= 0) {
      setMessage({ text: "Please set a valid Combo Selling Price (greater than 0).", type: "error" });
      return;
    }
    if (components.length === 0) {
      setMessage({ text: "A Combo Offer must include at least one product.", type: "error" });
      return;
    }

    setIsSaving(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      sku: sku.trim().toUpperCase(),
      description: description.trim() || null,
      features: features.filter(Boolean),
      price: numComboPrice,
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : individualTotalValue || null,
      tax_enabled: Boolean(taxEnabled),
      is_active: Boolean(isActive),
      is_featured: Boolean(isFeatured),
      primary_image_url: primaryImage?.url || null,
      primary_image_public_id: primaryImage?.public_id || null,
      images: galleryImages,
      items: components.map((c, idx) => ({
        product_id: c.product_id,
        quantity: c.quantity,
        sort_order: idx,
      })),
    };

    try {
      const endpoint = isEdit ? `/api/admin/combos/${initialData?.id}` : "/api/admin/combos";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessage({ text: data.error || "Failed to save combo offer.", type: "error" });
      } else {
        setMessage({
          text: isEdit ? "Combo offer updated successfully!" : "Combo offer created successfully!",
          type: "success",
        });
        setTimeout(() => {
          router.push("/admin/combos");
        }, 1200);
      }
    } catch (err) {
      console.error("[ComboForm submit exception]:", err);
      setMessage({ text: "Network error occurred while saving.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#DCCFB9]/60">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/combos"
            className="p-2 bg-white border border-[#DCCFB9] rounded-md text-[#183D2B] hover:bg-[#F7F5EF] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#183D2B] font-serif">
              {isEdit ? `Edit Combo: ${name || "Untitled"}` : "Create Retail Combo Offer"}
            </h1>
            <p className="text-xs text-[#5C6460]">
              Bundle multiple catalog products into a single high-converting retail offer with unified pricing and tax.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/admin/combos"
            className="px-4 py-2 border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#5C6460] bg-white hover:bg-[#F7F5EF] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-[#183D2B] text-white rounded-md text-xs font-semibold hover:bg-[#102D20] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isEdit ? "Update Combo Offer" : "Save Combo Offer"}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Details, Components, Features */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Information */}
          <div className="bg-white rounded-xl border border-[#DCCFB9]/70 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCCFB9]/40 pb-3">
              <Package size={16} className="text-[#183D2B]" />
              <h2 className="text-sm font-bold text-[#183D2B] uppercase tracking-wider">
                Basic Offer Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D211F] mb-1">
                  Combo Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury Skincare Essentials Trio"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1D211F] mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AUR-CMB-SKIN-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    required
                    className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-mono uppercase text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D211F] mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. luxury-skincare-essentials-trio"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    required
                    className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D211F] mb-1">
                  Combo Commercial Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Compelling marketing copy highlighting why these products were bundled together..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* 2. Components / Product Selector */}
          <div className="bg-white rounded-xl border border-[#DCCFB9]/70 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCCFB9]/40 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#183D2B]" />
                <h2 className="text-sm font-bold text-[#183D2B] uppercase tracking-wider">
                  Combo Contents ({components.length} Products)
                </h2>
              </div>
              <button
                type="button"
                onClick={handleOpenSelector}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] text-white rounded-md text-xs font-semibold hover:bg-[#102D20] transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={13} />
                <span>+ Select / Add Products</span>
              </button>
            </div>

            {components.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-[#DCCFB9] rounded-lg bg-[#FAF8F5] p-6 space-y-3">
                <Package size={32} className="mx-auto text-[#8E9590]" strokeWidth={1.3} />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1D211F]">No products selected yet</p>
                  <p className="text-[11px] text-[#5C6460]">
                    Click &ldquo;+ Select / Add Products&rdquo; to browse and add catalog items to this combo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenSelector}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183D2B] text-white rounded-md text-xs font-semibold hover:bg-[#102D20] cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Products from Catalog</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#DCCFB9]/40 border border-[#DCCFB9]/60 rounded-lg overflow-hidden bg-white">
                {components.map((c, index) => {
                  const lineTotal = (Number(c.product.retail_price) || 0) * c.quantity;
                  return (
                    <div
                      key={c.product_id}
                      className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors"
                    >
                      {/* Product details */}
                      <div className="flex items-center gap-3 min-w-0">
                        {c.product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.product.image_url}
                            alt={c.product.name}
                            className="w-12 h-12 object-cover rounded-md border border-[#DCCFB9]/60 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                            <Package size={20} strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[#1D211F] truncate">
                            {c.product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5C6460] flex-wrap">
                            <span className="font-mono">{c.product.sku}</span>
                            <span>•</span>
                            <span>AED {c.product.retail_price.toFixed(2)} each</span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-xs text-[10px] font-semibold ${
                                (c.product.stock_quantity ?? 0) > 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              Stock: {c.product.stock_quantity ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity, Subtotal, Reorder & Remove */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DCCFB9]/30">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[#5C6460]">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={c.quantity}
                            onChange={(e) =>
                              handleUpdateComponentQty(c.product_id, parseInt(e.target.value, 10) || 1)
                            }
                            className="w-14 h-8 px-2 bg-[#F7F5EF] border border-[#DCCFB9] rounded text-center text-xs font-bold text-[#183D2B] focus:bg-white outline-none"
                          />
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-[10px] text-[#8E9590] block">Line Value</span>
                          <span className="text-xs font-bold text-[#1D211F]">
                            AED {lineTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveComponent(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded text-[#5C6460] hover:text-[#183D2B] hover:bg-[#F7F5EF] disabled:opacity-25"
                            title="Move up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveComponent(index, "down")}
                            disabled={index === components.length - 1}
                            className="p-1 rounded text-[#5C6460] hover:text-[#183D2B] hover:bg-[#F7F5EF] disabled:opacity-25"
                            title="Move down"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(c.product_id)}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 ml-1"
                            title="Remove from combo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Derived Inventory Stock Breakdown Banner */}
            {components.length > 0 && (
              <div className="p-4 bg-[#FAF8F5] border border-[#DCCFB9]/80 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCCFB9]/50 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] font-bold text-[#C9A84C] uppercase tracking-wider">
                      Derived Live Inventory
                    </span>
                    <h3 className="text-sm font-extrabold text-[#183D2B] flex items-center gap-2">
                      <span>Available Combos:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-black ${
                          comboStockCalc.in_stock
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-red-100 text-red-900 border border-red-300"
                        }`}
                      >
                        {comboStockCalc.available_stock}{" "}
                        {comboStockCalc.available_stock === 1 ? "set" : "sets"}
                      </span>
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#5C6460]">
                    Calculated server-side from {components.length} component stock levels
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-[#183D2B] uppercase tracking-wider">
                    Component Availability:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {comboStockCalc.components.map((c) => (
                      <div
                        key={c.product_id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          c.in_stock
                            ? "bg-white border-[#DCCFB9]/70"
                            : "bg-red-50 border-red-200 text-red-900"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1D211F] truncate flex items-center gap-1">
                            <span>✓</span>
                            <span>{c.name}</span>
                          </p>
                          <p className="text-[10.5px] text-[#5C6460] mt-0.5">
                            <strong>{c.available_quantity}</strong> available ({c.required_quantity}×
                            required)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold block ${
                              c.max_combos > 0
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {c.max_combos} max
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-[#5C6460] italic pt-1">
                    Therefore: {comboStockCalc.available_stock} combos currently purchasable on
                    the retail storefront.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Features & What's Included */}
          <div className="bg-white rounded-xl border border-[#DCCFB9]/70 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCCFB9]/40 pb-3">
              <Sparkles size={16} className="text-[#183D2B]" />
              <h2 className="text-sm font-bold text-[#183D2B] uppercase tracking-wider">
                Combo Highlights & Benefits
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 3-step morning & evening glow routine"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-[#183D2B] text-white rounded-md text-xs font-semibold hover:bg-[#102D20] cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="space-y-1.5">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-[#FAF8F5] border border-[#DCCFB9]/50 rounded-md text-xs text-[#1D211F]"
                  >
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#183D2B] shrink-0" />
                      <span>{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-[#8E9590] hover:text-red-500 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Pricing & UX, Images, Settings */}
        <div className="space-y-6">
          {/* 1. Combo Pricing & Authoritative UX Box */}
          <div className="bg-white rounded-xl border border-[#DCCFB9]/70 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCCFB9]/40 pb-3">
              <DollarSign size={16} className="text-[#183D2B]" />
              <h2 className="text-sm font-bold text-[#183D2B] uppercase tracking-wider">
                Pricing & Value UX
              </h2>
            </div>

            {/* Informational Comparison Box */}
            <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F2EDE2] p-4 rounded-lg border border-[#DCCFB9] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5C6460]">Individual Catalog Value:</span>
                <span className="font-semibold text-[#1D211F] line-through">
                  AED {individualTotalValue.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-[#183D2B]">
                <span>Combo Selling Price:</span>
                <span>AED {numComboPrice.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-[#DCCFB9]/60 flex items-center justify-between text-xs">
                <span className="text-[#5C6460] font-medium flex items-center gap-1">
                  <Percent size={13} className="text-emerald-700" />
                  Customer Savings:
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Save AED {savingsAmount.toFixed(2)} ({savingsPercent}%)
                </span>
              </div>
            </div>

            {/* Price Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#1D211F] mb-1">
                  Combo Selling Price (AED) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 149.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-bold text-[#183D2B] focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D211F] mb-1">
                  Compare-at / Strike-through Price (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={individualTotalValue > 0 ? String(individualTotalValue) : "e.g. 180.00"}
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#5C6460] focus:bg-white outline-none"
                />
                <span className="text-[10px] text-[#8E9590] mt-1 block">
                  Leave empty to default to calculated individual catalog value.
                </span>
              </div>

              {/* Tax Toggle */}
              <div className="pt-3 border-t border-[#DCCFB9]/40 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#183D2B] rounded border-[#DCCFB9] focus:ring-[#183D2B]"
                  />
                  <span className="text-xs font-bold text-[#1D211F]">Enable 5% UAE VAT</span>
                </label>
                <p className="text-[11px] text-[#5C6460] leading-relaxed">
                  When enabled, 5% retail tax is applied to the combo selling price at checkout.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Combo Media & Visuals */}
          <div className="bg-white rounded-xl border border-[#DCCFB9]/70 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCCFB9]/40 pb-3">
              <Tag size={16} className="text-[#183D2B]" />
              <h2 className="text-sm font-bold text-[#183D2B] uppercase tracking-wider">
                Combo Offer Visuals
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                  Primary Offer Image
                </label>
                {primaryImage ? (
                  <div className="relative w-full aspect-square rounded-lg border border-[#DCCFB9] overflow-hidden bg-[#FAF8F5] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryImage.url}
                      alt="Combo Primary"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <CloudinaryUploader
                    label="Upload Combo Primary Image"
                    folder="aurelle/combos"
                    aspectRatio="square"
                    onUploadSuccess={(asset) => {
                      setPrimaryImage({
                        url: asset.secure_url,
                        public_id: asset.public_id,
                      });
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 3. Availability & Visibility Settings */}
          <div className="bg-white rounded-xl border border-[#DCCFB9]/70 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#183D2B] uppercase tracking-wider">
              Status & Storefront Flags
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#183D2B] rounded border-[#DCCFB9]"
                />
                <span className="text-xs font-semibold text-[#1D211F]">
                  Active & Available on Retail Storefront
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#183D2B] rounded border-[#DCCFB9]"
                />
                <span className="text-xs font-semibold text-[#1D211F]">
                  Feature on Homepage / Promoted Combos
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-[#DCCFB9]/40">
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-md text-[11px] text-amber-900 flex items-start gap-2">
                <Info size={14} className="shrink-0 text-amber-700 mt-0.5" />
                <span>
                  <strong>Retail Only:</strong> Combos are strictly excluded from B2B wholesale portals and pricing.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      {isSelectorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-xl border border-[#DCCFB9] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden text-left animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#DCCFB9]/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#183D2B]" />
                <h3 className="text-sm font-bold text-[#183D2B] uppercase tracking-wider">
                  Select Catalog Products
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="p-1 rounded-md text-[#5C6460] hover:text-[#1D211F] hover:bg-[#EDE7DE] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 border-b border-[#DCCFB9]/60 bg-white grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6460]" />
                <input
                  type="text"
                  placeholder="Search by title, SKU..."
                  value={selectorSearch}
                  onChange={(e) => setSelectorSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white outline-none"
                />
              </div>

              <div>
                <select
                  value={selectorCategory}
                  onChange={(e) => setSelectorCategory(e.target.value)}
                  className="w-full h-8 px-2 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectorBrand}
                  onChange={(e) => setSelectorBrand(e.target.value)}
                  className="w-full h-8 px-2 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                >
                  <option value="all">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Products List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#DCCFB9]/40 space-y-1">
              {loadingProducts ? (
                <div className="py-12 text-center text-xs text-[#5C6460] flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#183D2B]" />
                  <span>Loading product catalog...</span>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5C6460]">
                  No products matched your search filters.
                </div>
              ) : (
                filteredCatalog.map((prod) => {
                  const isChecked = tempSelectedIds.has(prod.id);
                  return (
                    <label
                      key={prod.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? "bg-[#183D2B]/5 border border-[#183D2B]/30" : "hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleProductInModal(prod.id)}
                          className="w-4 h-4 text-[#183D2B] rounded border-[#DCCFB9]"
                        />

                        {prod.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-10 h-10 object-cover rounded border border-[#DCCFB9]/60 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                            <Package size={16} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[#1D211F] truncate">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-[#5C6460]">
                            SKU: <span className="font-mono">{prod.sku}</span> | Category: {prod.category_name} | Stock: {prod.stock_quantity ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <span className="text-xs font-bold text-[#183D2B]">
                          AED {prod.retail_price.toFixed(2)}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#DCCFB9]/60 flex items-center justify-between shrink-0">
              <span className="text-xs text-[#5C6460]">
                {tempSelectedIds.size} product{tempSelectedIds.size === 1 ? "" : "s"} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen(false)}
                  className="px-4 py-2 border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#5C6460] bg-white hover:bg-[#F7F5EF]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmProductSelection}
                  className="px-5 py-2 bg-[#183D2B] text-white rounded-md text-xs font-semibold hover:bg-[#102D20]"
                >
                  Add Selected Products ({tempSelectedIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
