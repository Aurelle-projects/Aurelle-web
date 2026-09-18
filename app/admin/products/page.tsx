"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { Search, Eye, Edit, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";
import { AURELLE_PRODUCTS, ProductItem as MasterProduct } from "@/lib/products/mock-products";

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
  const [, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
          // Fallback to master mock catalog
          setProducts(
            AURELLE_PRODUCTS.map((p: MasterProduct) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              slug: p.slug,
              retail_price: p.retail_price,
              wholesale_price: p.wholesale_price,
              category_name: p.category_name,
              status: "published",
              image_url: p.images[0]?.url,
              stock_quantity: p.stock_quantity,
            }))
          );
        }
      } catch {
        setProducts(
          AURELLE_PRODUCTS.map((p: MasterProduct) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            slug: p.slug,
            retail_price: p.retail_price,
            wholesale_price: p.wholesale_price,
            category_name: p.category_name,
            status: "published",
            image_url: p.images[0]?.url,
            stock_quantity: p.stock_quantity,
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
              <option value="all">All 10 Categories</option>
              {AURELLE_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.name}>
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5C6460]">
                      <Package size={36} className="mx-auto mb-2 text-[#8E9590]" />
                      <p className="font-semibold">No products found matching criteria</p>
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
    </div>
  );
}
