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
  Plus,
  Sparkles,
  Percent,
  Layers,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { ComboOffer } from "@/types/combo";

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<ComboOffer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingCombo, setDeletingCombo] = useState<ComboOffer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Combos
  const loadCombos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/combos");
      const data = await res.json();
      if (res.ok && data.combos) {
        setCombos(data.combos);
      }
    } catch (err) {
      console.error("[AdminCombosPage] Failed to load combos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
  }, []);

  // Filter Combos
  const filteredCombos = useMemo(() => {
    const list = combos ?? [];
    const term = searchTerm.toLowerCase().trim();
    return list.filter((c) => {
      const matchesSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.sku.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.is_active) ||
        (statusFilter === "inactive" && !c.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [combos, searchTerm, statusFilter]);

  // Quick toggle active state
  const handleToggleActive = async (combo: ComboOffer) => {
    const updatedStatus = !combo.is_active;
    // Optimistic update
    setCombos((prev) =>
      prev ? prev.map((c) => (c.id === combo.id ? { ...c, is_active: updatedStatus } : c)) : null
    );

    try {
      const res = await fetch(`/api/admin/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: updatedStatus }),
      });
      if (!res.ok) {
        // Revert if failed
        loadCombos();
      }
    } catch {
      loadCombos();
    }
  };

  // Delete Combo
  const handleConfirmDelete = async () => {
    if (!deletingCombo) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/combos/${deletingCombo.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCombos((prev) => (prev ? prev.filter((c) => c.id !== deletingCombo.id) : null));
        setDeletingCombo(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete combo offer.");
      }
    } catch {
      alert("Network error while deleting combo offer.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Retail Combo Offers"
        subtitle="Manage promotional bundles and multi-product combo packs with unified pricing & tax."
        actionButton={{ label: "Create Combo Offer", href: "/admin/combos/new" }}
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-white p-3 rounded-lg border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search combos by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Combos Table */}
        <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#5C6460]">
              <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading combo offers...
            </div>
          ) : filteredCombos.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#5C6460] space-y-3">
              <Package size={36} className="mx-auto text-[#8E9590]" strokeWidth={1.3} />
              <div className="space-y-1">
                <p className="font-bold text-[#1D211F] text-sm">No combo offers found</p>
                <p>Create your first combo offer to bundle products together for retail shoppers.</p>
              </div>
              <Link
                href="/admin/combos/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183D2B] text-white rounded-md text-xs font-semibold hover:bg-[#102D20] transition-colors"
              >
                <Plus size={14} />
                <span>Create Combo Offer</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#183D2B] uppercase text-[10.5px] font-bold tracking-wider border-b border-[#DCCFB9]/60">
                  <tr>
                    <th className="px-4 py-3">Combo Offer</th>
                    <th className="px-4 py-3">Included Products</th>
                    <th className="px-4 py-3 text-center">Available Sets</th>
                    <th className="px-4 py-3">Pricing & Savings</th>
                    <th className="px-4 py-3 text-center">Tax (5%)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCCFB9]/40 text-[#1D211F]">
                  {filteredCombos.map((combo) => {
                    const firstImage =
                      combo.primary_image_url ||
                      combo.images?.[0]?.secure_url ||
                      combo.items?.[0]?.product?.product_images?.[0]?.secure_url ||
                      null;

                    const availSets = combo.available_stock ?? 0;
                    const isInStock = combo.in_stock !== false && availSets > 0;

                    return (
                      <tr key={combo.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        {/* Combo Basic Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {firstImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={firstImage}
                                alt={combo.name}
                                className="w-12 h-12 rounded-md object-cover border border-[#DCCFB9]/60 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                                <Package size={18} strokeWidth={1.5} />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs text-[#1D211F] hover:text-[#183D2B]">
                                  {combo.name}
                                </p>
                                {combo.is_featured && (
                                  <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[9.5px] font-bold flex items-center gap-0.5">
                                    <Sparkles size={9} />
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#5C6460] font-mono mt-0.5">
                                SKU: {combo.sku}
                              </p>
                              <Link
                                href={`/combos/${combo.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-[10.5px] text-[#183D2B] hover:underline mt-0.5"
                              >
                                <span>View live</span>
                                <ExternalLink size={10} />
                              </Link>
                            </div>
                          </div>
                        </td>

                        {/* Components list preview */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1 max-w-xs">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#183D2B]">
                              <Layers size={12} />
                              <span>{combo.items?.length || 0} component products:</span>
                            </div>
                            <ul className="text-[11px] text-[#5C6460] space-y-0.5">
                              {combo.items?.map((it) => (
                                <li key={it.id} className="truncate">
                                  • {it.product?.name || "Product"} × <strong>{it.quantity}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>

                        {/* Available Sets */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                isInStock
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {isInStock ? `${availSets} in stock` : "0 (Out of stock)"}
                            </span>
                            <span className="text-[9.5px] text-[#8E9590] mt-0.5">
                              from live components
                            </span>
                          </div>
                        </td>

                        {/* Pricing & Savings */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#183D2B]">
                                AED {combo.price.toFixed(2)}
                              </span>
                              {combo.total_individual_price && (
                                <span className="text-xs text-[#8E9590] line-through">
                                  AED {combo.total_individual_price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {combo.savings_amount && combo.savings_amount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                                Save AED {combo.savings_amount.toFixed(2)} ({combo.savings_percentage}%)
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Tax Enabled */}
                        <td className="px-4 py-3.5 text-center">
                          {combo.tax_enabled ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[10px] font-bold">
                              <Check size={10} />
                              5% Tax
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-[10px] font-semibold">
                              Exempt
                            </span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(combo)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              combo.is_active
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200"
                            }`}
                          >
                            {combo.is_active ? "Active" : "Disabled"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/combos/${combo.id}`}
                              className="p-1.5 text-[#5C6460] hover:text-[#183D2B] hover:bg-[#FAF8F5] rounded transition-colors"
                              title="Edit Combo Offer"
                            >
                              <Edit size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeletingCombo(combo)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Delete Combo Offer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCombo && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingCombo)}
          title={`Delete Combo Offer "${deletingCombo.name}"?`}
          description="Are you sure you want to permanently delete this combo offer? Historical order records will be safely preserved."
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingCombo(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
