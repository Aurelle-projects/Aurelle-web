"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { Search, Eye, Edit, Package, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  slug: string;
  retail_price: number;
  wholesale_price?: number | null;
  category_name?: string;
  status: string;
  image_url?: string;
  stock_quantity: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("products")
          .select(`
            id, name, slug, sku, retail_price, wholesale_price, status,
            category:categories(name),
            product_images(secure_url, is_primary),
            inventory(stock_quantity)
          `)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: ProductRow[] = data.map((p: any) => {
            const primaryImg =
              p.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.secure_url ||
              p.product_images?.[0]?.secure_url;
            return {
              id: p.id,
              name: p.name,
              sku: p.sku,
              slug: p.slug,
              retail_price: p.retail_price,
              wholesale_price: p.wholesale_price,
              category_name: p.category?.name || "Unassigned",
              status: p.status || "published",
              image_url: primaryImg,
              stock_quantity: p.inventory?.[0]?.stock_quantity ?? 10,
            };
          });
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    async function loadCategories() {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("categories")
          .select("id, name")
          .is("parent_id", null)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (data) setDbCategories(data);
      } catch { /* silent */ }
    }

    loadProducts();
    loadCategories();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
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

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filter / Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search products by title or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer w-full sm:w-auto"
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
        <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCCFB9]/60 text-[11px] font-bold text-[#5C6460] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Retail Price</th>
                  <th className="py-3.5 px-4">Wholesale Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCCFB9]/40 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5C6460]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
                        <p className="font-semibold text-xs text-[#5C6460]">Loading database products...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5C6460]">
                      <Package size={36} className="mx-auto mb-2 text-[#8E9590]" />
                      <p className="font-semibold">No products found</p>
                      <p className="text-xs text-[#8E9590] mt-1">
                        {products.length === 0
                          ? "Your catalog is empty. Create your first product to get started."
                          : "No products match the selected filters."}
                      </p>
                      {products.length === 0 && (
                        <Link
                          href="/admin/products/new"
                          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#183D2B] text-white text-xs font-bold rounded-lg hover:bg-[#122419] transition-colors"
                        >
                          Add First Product
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F7F5EF]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-11 h-11 rounded-lg object-cover border border-[#DCCFB9]/60 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1D211F] truncate max-w-xs">{item.name}</p>
                            <span className="text-[11px] text-[#5C6460]">ID: {item.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-[#5C6460]">
                        {item.sku}
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-[#1D211F]">
                        {item.category_name}
                      </td>

                      <td className="py-3 px-4 font-bold text-[#183D2B]">
                        AED {item.retail_price}
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-[#C9A84C]">
                        {item.wholesale_price ? `AED ${item.wholesale_price}` : "—"}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
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

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${item.slug}`}
                            target="_blank"
                            className="p-1.5 text-[#5C6460] hover:text-[#183D2B] rounded hover:bg-[#F7F5EF]"
                            title="View on Storefront"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            href={`/admin/products/${item.id}`}
                            className="p-1.5 text-[#5C6460] hover:text-[#183D2B] rounded hover:bg-[#F7F5EF]"
                            title="Edit Product"
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-[#5C6460] hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
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
