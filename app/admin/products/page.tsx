"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import {
  Search,
  Eye,
  Edit,
  Package,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ArrowUpDown,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";
import { useAdminData, ProductRow } from "@/context/AdminDataContext";

export default function AdminProductsPage() {
  const {
    products,
    productsLoading,
    loadProducts,
    setProducts,
    categories,
    loadCategories,
    brands,
    loadBrands,
  } = useAdminData();

  // Modals & Actions State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "wholesale-asc"
  >("newest");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, [loadProducts, loadCategories, loadBrands]);

  const loading = products === null && productsLoading;

  // Active Categories
  const dbCategories = useMemo(() => {
    return (categories || []).filter((c) => c.is_active);
  }, [categories]);

  // Available Brands (combined from brands table and distinct product brand names)
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, string>();
    (brands || []).forEach((b) => {
      if (b.name) brandMap.set(b.name, b.name);
    });
    (products || []).forEach((p) => {
      if (p.brand_name) brandMap.set(p.brand_name, p.brand_name);
    });
    return Array.from(brandMap.values()).sort((a, b) => a.localeCompare(b));
  }, [brands, products]);

  // Overall Catalog Statistics for Metric Tabs
  const stats = useMemo(() => {
    const list = products ?? [];
    let published = 0;
    let drafts = 0;
    let archived = 0;
    let inStock = 0;
    let outOfStock = 0;

    for (const p of list) {
      const st = (p.status || "published").toLowerCase();
      if (st === "published") published++;
      else if (st === "draft") drafts++;
      else if (st === "archived") archived++;

      if (p.is_out_of_stock) {
        outOfStock++;
      } else {
        inStock++;
      }
    }

    return {
      total: list.length,
      published,
      drafts,
      archived,
      inStock,
      outOfStock,
    };
  }, [products]);

  // Filtering Logic
  const filtered = useMemo(() => {
    const list = products ?? [];
    const term = searchTerm.toLowerCase().trim();

    return list.filter((p) => {
      // Search across name, SKU, brand, category, and ID
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(term)) ||
        (p.category_name && p.category_name.toLowerCase().includes(term)) ||
        p.id.toLowerCase().includes(term);

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || p.category_name === selectedCategory;

      // Brand filter
      const matchesBrand =
        selectedBrand === "all" || p.brand_name === selectedBrand;

      // Availability filter
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && !p.is_out_of_stock) ||
        (selectedAvailability === "out_of_stock" && p.is_out_of_stock);

      // Status filter
      const itemStatus = (p.status || "published").toLowerCase();
      const matchesStatus =
        selectedStatus === "all" || itemStatus === selectedStatus;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesAvailability &&
        matchesStatus
      );
    });
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedBrand,
    selectedAvailability,
    selectedStatus,
  ]);

  // Sorting Logic
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => Number(a.retail_price) - Number(b.retail_price));
      case "price-desc":
        return list.sort((a, b) => Number(b.retail_price) - Number(a.retail_price));
      case "wholesale-asc":
        return list.sort(
          (a, b) => (Number(a.wholesale_price) || 0) - (Number(b.wholesale_price) || 0)
        );
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case "oldest":
        return list.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return da - db;
        });
      case "newest":
      default:
        return list.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });
    }
  }, [filtered, sortBy]);

  // Pagination Logic
  const totalItems = sorted.length;
  const isAllPages = pageSize >= 99999;
  const totalPages = isAllPages ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedProducts = useMemo(() => {
    if (isAllPages) return sorted;
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize, isAllPages]);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = isAllPages ? totalItems : Math.min(safePage * pageSize, totalItems);

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedCategory !== "all" ||
    selectedBrand !== "all" ||
    selectedAvailability !== "all" ||
    selectedStatus !== "all" ||
    sortBy !== "newest";

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedAvailability("all");
    setSelectedStatus("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Quick tab switch helper
  const handleQuickTabSelect = (tab: "all" | "published" | "draft" | "in_stock" | "out_of_stock") => {
    setCurrentPage(1);
    if (tab === "all") {
      setSelectedStatus("all");
      setSelectedAvailability("all");
    } else if (tab === "published") {
      setSelectedStatus("published");
      setSelectedAvailability("all");
    } else if (tab === "draft") {
      setSelectedStatus("draft");
      setSelectedAvailability("all");
    } else if (tab === "in_stock") {
      setSelectedStatus("all");
      setSelectedAvailability("available");
    } else if (tab === "out_of_stock") {
      setSelectedStatus("all");
      setSelectedAvailability("out_of_stock");
    }
  };

  // Copy product ID / SKU helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Delete product action
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : null));
        setDeleteTarget(null);
      } else {
        alert(result.error || "Failed to delete product.");
      }
    } catch {
      alert("Network error while deleting product.");
    } finally {
      setDeletingId(null);
    }
  }

  // Generate pagination page numbers with smart ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (safePage > 3) pages.push("...");

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      <AdminHeader
        title="Products Catalog"
        subtitle="Manage retail and wholesale products across all official Aurelle categories and luxury brands."
        actionButton={{ label: "New Product", href: "/admin/products/new" }}
        secondaryButton={{ label: "Create Combo Offer", href: "/admin/combos/new" }}
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Quick Filter Status Tabs */}
        <div className="bg-white p-3 rounded-lg border border-[#DCCFB9]/60 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span className="text-[11px] font-bold text-[#5C6460] mr-1 hidden sm:inline">
              Filter By:
            </span>

            {/* All Products */}
            <button
              type="button"
              onClick={() => handleQuickTabSelect("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === "all" && selectedAvailability === "all"
                  ? "bg-[#183D2B] text-white shadow-xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-[#1D211F] hover:bg-[#EFECE4]"
              }`}
            >
              <Package size={13} />
              <span>All Products</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === "all" && selectedAvailability === "all"
                    ? "bg-white/20 text-white"
                    : "bg-[#DCCFB9]/50 text-[#1D211F]"
                }`}
              >
                {stats.total}
              </span>
            </button>

            {/* Published */}
            <button
              type="button"
              onClick={() => handleQuickTabSelect("published")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === "published"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-emerald-800 hover:bg-[#EFECE4]"
              }`}
            >
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Published</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === "published"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {stats.published}
              </span>
            </button>

            {/* Drafts */}
            <button
              type="button"
              onClick={() => handleQuickTabSelect("draft")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === "draft"
                  ? "bg-amber-700 text-white shadow-xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-amber-800 hover:bg-[#EFECE4]"
              }`}
            >
              <Clock size={13} className="text-amber-300" />
              <span>Drafts</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === "draft"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {stats.drafts}
              </span>
            </button>

            {/* In Stock */}
            <button
              type="button"
              onClick={() => handleQuickTabSelect("in_stock")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedAvailability === "available"
                  ? "bg-[#183D2B] text-white shadow-xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-[#1D211F] hover:bg-[#EFECE4]"
              }`}
            >
              <span>In Stock</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedAvailability === "available"
                    ? "bg-white/20 text-white"
                    : "bg-[#DCCFB9]/50 text-[#1D211F]"
                }`}
              >
                {stats.inStock}
              </span>
            </button>

            {/* Out of Stock */}
            <button
              type="button"
              onClick={() => handleQuickTabSelect("out_of_stock")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedAvailability === "out_of_stock"
                  ? "bg-rose-700 text-white shadow-xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-rose-800 hover:bg-[#EFECE4]"
              }`}
            >
              <AlertCircle size={13} className="text-rose-300" />
              <span>Out of Stock</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedAvailability === "out_of_stock"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {stats.outOfStock}
              </span>
            </button>
          </div>

          {/* Quick Counter Info */}
          <div className="text-right shrink-0 hidden md:block">
            <span className="text-xs font-bold text-[#183D2B]">
              {filtered.length}
            </span>
            <span className="text-[11px] text-[#5C6460] ml-1">
              of {stats.total} total items
            </span>
          </div>
        </div>

        {/* Comprehensive Filter & Search Toolbar */}
        <div className="bg-white p-3.5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Search Input (Title, SKU, Brand, ID) */}
            <div className="relative md:col-span-4">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6460]"
              />
              <input
                type="text"
                placeholder="Search by title, SKU, brand, ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-8 pr-8 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] placeholder:text-[#8E9590] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/15 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E9590] hover:text-[#1D211F] p-0.5 rounded"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-medium text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {dbCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-medium text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none cursor-pointer"
              >
                <option value="all">All Brands</option>
                {availableBrands.map((bName) => (
                  <option key={bName} value={bName}>
                    {bName}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Availability Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedAvailability}
                onChange={(e) => {
                  setSelectedAvailability(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-medium text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none cursor-pointer"
              >
                <option value="all">All Stock Status</option>
                <option value="available">In Stock Only</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-medium text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name-asc">Sort: Name (A to Z)</option>
                <option value="name-desc">Sort: Name (Z to A)</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
                <option value="wholesale-asc">Sort: Wholesale Price</option>
              </select>
            </div>
          </div>

          {/* Bottom Bar: Status Selector, Items-per-page & Reset */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-[#DCCFB9]/40 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#5C6460]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-7 px-2 bg-[#F7F5EF] border border-[#DCCFB9] rounded text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <span className="text-[11px] font-bold text-[#5C6460] ml-2">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 px-2 bg-[#F7F5EF] border border-[#DCCFB9] rounded text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
              >
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={99999}>Show All</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#183D2B] bg-[#183D2B]/5 hover:bg-[#183D2B]/10 rounded border border-[#183D2B]/20 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            <div className="text-[11px] font-medium text-[#5C6460]">
              Showing <span className="font-bold text-[#1D211F]">{startItem}</span> to{" "}
              <span className="font-bold text-[#1D211F]">{endItem}</span> of{" "}
              <span className="font-bold text-[#1D211F]">{totalItems}</span> matching products
              {totalItems !== stats.total && (
                <span className="text-[#8E9590] ml-1">
                  (filtered from {stats.total} total)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Products Table with Row Numbering */}
        <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCCFB9]/60 text-[10px] font-bold text-[#5C6460] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Product Details</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Brand</th>
                  <th className="py-3 px-3.5">Retail Price</th>
                  <th className="py-3 px-3.5">Wholesale Price</th>
                  <th className="py-3 px-3.5">Stock</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCCFB9]/30 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-[#5C6460]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
                        <p className="font-semibold text-xs text-[#5C6460]">
                          Loading database products catalog...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#5C6460]">
                      <Package size={36} className="mx-auto mb-2.5 text-[#8E9590]" />
                      <p className="font-bold text-sm text-[#1D211F]">No products found</p>
                      <p className="text-xs text-[#8E9590] mt-1 max-w-sm mx-auto">
                        {stats.total === 0
                          ? "Your catalog is empty. Create your first product to get started."
                          : "No products match the selected search, category, brand, or status filters."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1.5 bg-[#183D2B] text-white text-xs font-bold rounded-md hover:bg-[#122419] transition-colors"
                        >
                          <RotateCcw size={13} />
                          Clear All Filters
                        </button>
                      )}
                      {stats.total === 0 && (
                        <Link
                          href="/admin/products/new"
                          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#183D2B] text-white text-xs font-bold rounded hover:bg-[#122419] transition-colors"
                        >
                          Add First Product
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((item, index) => {
                    const rowNumber = isAllPages
                      ? index + 1
                      : (safePage - 1) * pageSize + index + 1;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F7F5EF]/50 transition-colors group"
                      >
                        {/* 1. Row Number */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-xs font-bold text-[#8E9590] group-hover:text-[#183D2B] transition-colors">
                            #{rowNumber}
                          </span>
                        </td>

                        {/* 2. Product Name, Thumbnail, SKU & Copy ID */}
                        <td className="py-3 px-3.5 max-w-sm">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/products/${item.id}`}
                              className="shrink-0 relative group/thumb"
                            >
                              {item.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-md object-cover border border-[#DCCFB9]/70 group-hover/thumb:border-[#183D2B] transition-colors shadow-2xs"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-[#F7F5EF] border border-[#DCCFB9]/70 flex items-center justify-center text-[#8E9590] group-hover/thumb:border-[#183D2B] transition-colors">
                                  <Package size={16} />
                                </div>
                              )}
                            </Link>

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/admin/products/${item.id}`}
                                className="font-semibold text-xs text-[#1D211F] hover:text-[#183D2B] hover:underline transition-colors line-clamp-1 block"
                                title={`Edit ${item.name}`}
                              >
                                {item.name}
                              </Link>

                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#5C6460] flex-wrap">
                                {item.sku ? (
                                  <span className="font-mono bg-[#F7F5EF] px-1.5 py-0.2 rounded border border-[#DCCFB9]/60 text-[#1D211F] font-semibold">
                                    SKU: {item.sku}
                                  </span>
                                ) : (
                                  <span className="text-[#8E9590] italic">No SKU</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.id, item.id)}
                                  className="inline-flex items-center gap-0.5 text-[#8E9590] hover:text-[#183D2B] transition-colors font-mono cursor-pointer"
                                  title="Click to copy full Product UUID"
                                >
                                  {copiedId === item.id ? (
                                    <span className="text-emerald-700 font-bold inline-flex items-center gap-0.5">
                                      <Check size={10} /> Copied!
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Copy size={9} /> ...{item.id.slice(-6)}
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Category & Subcategory */}
                        <td className="py-3 px-3.5 text-[11px] text-[#1D211F]">
                          <div className="font-semibold text-xs">
                            {item.category_name}
                          </div>
                          {item.subcategory_name && (
                            <div className="inline-block mt-0.5 text-[10px] font-medium text-[#5C6460] bg-[#F7F5EF] px-1.5 py-0.2 rounded border border-[#DCCFB9]/40">
                              {item.subcategory_name}
                            </div>
                          )}
                        </td>

                        {/* 4. Brand */}
                        <td className="py-3 px-3.5 text-xs">
                          {item.brand_name ? (
                            <span className="font-semibold text-[#183D2B] bg-[#183D2B]/5 px-2 py-0.5 rounded border border-[#183D2B]/10">
                              {item.brand_name}
                            </span>
                          ) : (
                            <span className="text-[#8E9590]">—</span>
                          )}
                        </td>

                        {/* 5. Retail Price */}
                        <td className="py-3 px-3.5 font-bold text-xs text-[#183D2B]">
                          AED {Number(item.retail_price).toFixed(2)}
                        </td>

                        {/* 6. Wholesale Price */}
                        <td className="py-3 px-3.5 text-xs font-semibold text-[#C9A84C]">
                          {item.wholesale_price
                            ? `AED ${Number(item.wholesale_price).toFixed(2)}`
                            : "—"}
                        </td>

                        {/* 7. Stock Availability */}
                        <td className="py-3 px-3.5">
                          {item.is_out_of_stock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Available
                            </span>
                          )}
                        </td>

                        {/* 8. Publishing Status */}
                        <td className="py-3 px-3.5">
                          {item.status === "published" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                              Published
                            </span>
                          ) : item.status === "draft" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 uppercase tracking-wider">
                              Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#F7F5EF] text-[#5C6460] border border-[#DCCFB9]/60 uppercase tracking-wider">
                              {item.status}
                            </span>
                          )}
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/products/${item.slug}`}
                              target="_blank"
                              className="p-1.5 text-[#5C6460] hover:text-[#183D2B] rounded hover:bg-[#F7F5EF] transition-colors"
                              title="View Product on Storefront"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/admin/products/${item.id}`}
                              className="p-1.5 text-[#5C6460] hover:text-[#183D2B] rounded hover:bg-[#F7F5EF] transition-colors"
                              title="Edit Product Details"
                            >
                              <Edit size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-[#5C6460] hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {!loading && totalItems > 0 && (
            <div className="bg-[#FAF8F5] px-4 py-3 border-t border-[#DCCFB9]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-[#5C6460] font-medium">
                Showing <span className="font-bold text-[#1D211F]">{startItem}</span> to{" "}
                <span className="font-bold text-[#1D211F]">{endItem}</span> of{" "}
                <span className="font-bold text-[#1D211F]">{totalItems}</span> products
              </div>

              {!isAllPages && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={safePage === 1}
                    className="p-1.5 rounded border border-[#DCCFB9] bg-white text-[#5C6460] hover:bg-[#F7F5EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                  >
                    <ChevronsLeft size={14} />
                  </button>

                  {/* Previous Page */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded border border-[#DCCFB9] bg-white text-[#5C6460] hover:bg-[#F7F5EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {/* Page Number Pills */}
                  <div className="flex items-center gap-1 mx-1">
                    {pageNumbers.map((num, i) =>
                      typeof num === "number" ? (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all cursor-pointer ${
                            safePage === num
                              ? "bg-[#183D2B] text-white shadow-2xs"
                              : "bg-white border border-[#DCCFB9] text-[#1D211F] hover:bg-[#F7F5EF]"
                          }`}
                        >
                          {num}
                        </button>
                      ) : (
                        <span key={i} className="px-1 text-[#8E9590]">
                          ...
                        </span>
                      )
                    )}
                  </div>

                  {/* Next Page */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded border border-[#DCCFB9] bg-white text-[#5C6460] hover:bg-[#F7F5EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight size={14} />
                  </button>

                  {/* Last Page */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded border border-[#DCCFB9] bg-white text-[#5C6460] hover:bg-[#F7F5EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
        itemType="product"
        warningNote="This product will be permanently removed from the storefront and admin catalog."
        isLoading={!!deletingId}
      />
    </div>
  );
}
