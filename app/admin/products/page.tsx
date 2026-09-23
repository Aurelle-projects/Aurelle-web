"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { Search, Eye, Edit, Package, Trash2 } from "lucide-react";
import { useAdminData, ProductRow } from "@/context/AdminDataContext";

export default function AdminProductsPage() {
  const {
    products,
    productsLoading,
    loadProducts,
    setProducts,
    categories,
    loadCategories,
  } = useAdminData();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const loading = products === null && productsLoading;
  const dbCategories = useMemo(() => {
    return (categories || []).filter((c) => c.is_active);
  }, [categories]);

  const filtered = useMemo(() => {
    const list = products ?? [];
    const term = searchTerm.toLowerCase().trim();
    return list.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term));
      const matchesCategory =
        selectedCategory === "all" || p.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

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

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Products Catalog"
        subtitle="Manage retail and wholesale inventory across the 10 official Aurelle categories."
        actionButton={{ label: "New Product", href: "/admin/products/new" }}
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Filter / Search Bar */}
        <div className="bg-white p-3 rounded-lg border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search products by title or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#1D211F] outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              {dbCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCCFB9]/60 text-[10px] font-bold text-[#5C6460] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Product</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5">Retail Price</th>
                  <th className="py-2.5 px-3.5">Wholesale Price</th>
                  <th className="py-2.5 px-3.5">Stock</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCCFB9]/30 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#5C6460]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
                        <p className="font-semibold text-xs text-[#5C6460]">Loading database products...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#5C6460]">
                      <Package size={30} className="mx-auto mb-2 text-[#8E9590]" />
                      <p className="font-semibold text-xs">No products found</p>
                      <p className="text-[11px] text-[#8E9590] mt-0.5">
                        {products?.length === 0
                          ? "Your catalog is empty. Create your first product to get started."
                          : "No products match the selected filters."}
                      </p>
                      {products?.length === 0 && (
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
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F7F5EF]/50 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-9 h-9 rounded object-cover border border-[#DCCFB9]/60 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                              <Package size={15} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[#1D211F] truncate max-w-xs">{item.name}</p>
                            <span className="text-[10px] text-[#5C6460]">ID: {item.id}</span>
                          </div>
                        </div>
                      </td>

      

                      <td className="py-2.5 px-3.5 text-[11px] font-medium text-[#1D211F]">
                        {item.category_name}
                      </td>

                      <td className="py-2.5 px-3.5 font-bold text-[#183D2B]">
                        AED {item.retail_price}
                      </td>

                      <td className="py-2.5 px-3.5 text-[11px] font-semibold text-[#C9A84C]">
                        {item.wholesale_price ? `AED ${item.wholesale_price}` : "—"}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                            item.stock_quantity > 10
                              ? "bg-emerald-50 text-emerald-800"
                              : item.stock_quantity > 0
                              ? "bg-amber-50 text-amber-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          {item.stock_quantity} in stock
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          {item.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${item.slug}`}
                            target="_blank"
                            className="p-1 text-[#5C6460] hover:text-[#183D2B] rounded hover:bg-[#F7F5EF]"
                            title="View on Storefront"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/admin/products/${item.id}`}
                            className="p-1 text-[#5C6460] hover:text-[#183D2B] rounded hover:bg-[#F7F5EF]"
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 text-[#5C6460] hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
        itemType="product"
        warningNote="This product will be permanently removed from inventory and the storefront."
        isLoading={!!deletingId}
      />
    </div>
  );
}
