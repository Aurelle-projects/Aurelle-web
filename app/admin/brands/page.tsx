"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

import {
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  X,
  Tag,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  logo_public_id: string | null;
  sort_order: number;
  is_active: boolean;
}

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  logo_url: null as string | null,
  logo_public_id: null as string | null,
  sort_order: 0,
  is_active: true,
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brands");
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to load brands.");
      if (result.brands) setBrands(result.brands);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function showMsg(text: string, type: "success" | "error") {
    setMessage({ text, type });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(null), 4000);
  }

  function openCreate() {
    const nextOrder = brands.length > 0
      ? Math.max(...brands.map((b) => b.sort_order ?? 0)) + 1
      : 1;
    setForm({ ...EMPTY_FORM, sort_order: nextOrder });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(b: Brand) {
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description ?? "",
      logo_url: b.logo_url,
      logo_public_id: b.logo_public_id,
      sort_order: b.sort_order ?? 0,
      is_active: b.is_active,
    });
    setEditingId(b.id);
    setShowForm(true);
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "name" && !editingId ? { slug: slugify(value) } : {}),
      }));
    }
  }

  function handleLogoUpload(asset: CloudinaryAsset) {
    setForm((prev) => ({ ...prev, logo_url: asset.secure_url, logo_public_id: asset.public_id }));
  }

  function handleLogoRemove() {
    setForm((prev) => ({ ...prev, logo_url: null, logo_public_id: null }));
  }

  async function handleSave() {
    if (!form.name.trim()) return showMsg("Brand name is required.", "error");
    if (!form.slug.trim()) return showMsg("Slug is required.", "error");

    // Prevent duplicate sort_order
    const conflict = brands.find(
      (b) => b.sort_order === form.sort_order && b.id !== editingId
    );
    if (conflict) {
      return showMsg(
        `Display order ${form.sort_order} is already used by "${conflict.name}". Choose a different number.`,
        "error"
      );
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        description: form.description.trim() || null,
        logo_url: form.logo_url,
        logo_public_id: form.logo_public_id,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      const res = await fetch("/api/admin/brands", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to save brand.");

      showMsg(editingId ? "Brand updated successfully." : "Brand created successfully.", "success");
      setShowForm(false);
      await loadBrands();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showMsg(err?.message || "Failed to save brand.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/brands?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to delete brand.");

      setBrands((prev) => prev.filter((b) => b.id !== id));
      showMsg(`Brand "${name}" deleted successfully.`, "success");
      setDeleteTarget(null);
      await loadBrands();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showMsg(err?.message || "Failed to delete brand.", "error");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSwapOrder(index: number, direction: "up" | "down") {
    const sorted = [...brands].sort((a, b) => a.sort_order - b.sort_order);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const brandA = sorted[index];
    const brandB = sorted[targetIndex];
    if (!brandA || !brandB) return;

    // Optimistic UI update
    const newBrands = brands.map((b) => {
      if (b.id === brandA.id) return { ...b, sort_order: brandB.sort_order };
      if (b.id === brandB.id) return { ...b, sort_order: brandA.sort_order };
      return b;
    });
    setBrands(newBrands.sort((a, b) => a.sort_order - b.sort_order));

    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/brands", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: brandA.id, sort_order: brandB.sort_order }),
        }),
        fetch("/api/admin/brands", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: brandB.id, sort_order: brandA.sort_order }),
        }),
      ]);
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      if (d1.error || d2.error) throw new Error(d1.error || d2.error);
    } catch {
      // Revert on failure
      await loadBrands();
      showMsg("Failed to reorder brands.", "error");
    }
  }

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="Brand Management"
        subtitle="Create, edit, and manage all brands. Brands appear in product listings and the shop-by-brand nav."
        actionButton={{ label: "Add Brand", href: "#" }}
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}>
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#5C6460]">
            {brands.length} brand{brands.length !== 1 ? "s" : ""} in database
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add Brand
          </button>
        </div>

        {/* Create / Edit Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />

            {/* Modal panel */}
            <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DCCFB9]/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCCFB9]/40 bg-[#F7F5EF]">
                <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider">
                  {editingId ? "Edit Brand" : "New Brand"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-1.5 text-[#5C6460] hover:text-[#1D211F] rounded-lg hover:bg-white/80 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Logo */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-2">
                      Brand Logo
                    </label>
                    <CloudinaryUploader
                      label=""
                      description="Square or transparent PNG recommended"
                      aspectRatio="square"
                      folder="aurelle/brands"
                      value={form.logo_url}
                      publicId={form.logo_public_id}
                      onUploadSuccess={handleLogoUpload}
                      onRemove={handleLogoRemove}
                    />
                  </div>

                  {/* Name + Display Order — stacked in right column */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Brand Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        placeholder="Enter Brand Name"
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                      />
                    </div>

                    {/* Slug — hidden, auto-generated */}
                    <input type="hidden" name="slug" value={form.slug} />

                    {/* Sort Order */}
                    <div>
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Display Order
                      </label>
                      <input
                        type="number"
                        name="sort_order"
                        min={0}
                        value={form.sort_order}
                        onChange={(e) => setForm((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                      />
                      <p className="mt-1 text-[10px] text-[#8E9590]">Lower number = appears first in the slider</p>
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#1D211F]">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleFormChange}
                        className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B]"
                      />
                      <span>Active (visible in storefront nav &amp; filters)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DCCFB9]/40 bg-[#F7F5EF]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5C6460] hover:text-[#1D211F] rounded-lg hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? "Saving..." : editingId ? "Update Brand" : "Create Brand"}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Brands List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#5C6460]">
            <Loader2 size={28} className="animate-spin text-[#183D2B]" />
            <p className="text-sm font-semibold">Loading brands from database...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#5C6460]">
            <Tag size={36} className="text-[#8E9590]" />
            <p className="font-semibold text-sm">No brands yet</p>
            <p className="text-xs text-[#8E9590]">Click &ldquo;Add Brand&rdquo; to create your first brand.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_48px_1fr_90px_80px_120px] items-center gap-3 px-4 py-2.5 bg-[#F7F5EF] border-b border-[#DCCFB9]/60">
              <span className="text-[10px] font-bold text-[#8E9590] uppercase tracking-wider text-center">#</span>
              <span className="text-[10px] font-bold text-[#8E9590] uppercase tracking-wider">Logo</span>
              <span className="text-[10px] font-bold text-[#8E9590] uppercase tracking-wider">Brand</span>
              <span className="text-[10px] font-bold text-[#8E9590] uppercase tracking-wider">Status</span>
              <span className="text-[10px] font-bold text-[#8E9590] uppercase tracking-wider text-center">Order</span>
              <span className="text-[10px] font-bold text-[#8E9590] uppercase tracking-wider text-right">Actions</span>
            </div>

            {/* Rows */}
            {[...brands]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((brand, idx, arr) => (
                <div
                  key={brand.id}
                  className="grid grid-cols-[40px_48px_1fr_90px_80px_120px] items-center gap-3 px-4 py-3 border-b border-[#DCCFB9]/30 last:border-0 hover:bg-[#F7F5EF]/60 transition-colors"
                >
                  {/* Order number */}
                  <span className="text-xs font-bold text-[#8E9590] text-center">{brand.sort_order}</span>

                  {/* Logo */}
                  {brand.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="w-10 h-10 rounded-lg object-contain bg-[#F7F5EF] border border-[#DCCFB9]/60 p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                      <Tag size={16} />
                    </div>
                  )}

                  {/* Name + slug */}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#1D211F] truncate">{brand.name}</p>
                    <p className="text-[11px] font-mono text-[#8E9590] truncate">{brand.slug}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                    brand.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {brand.is_active ? "Active" : "Inactive"}
                  </span>

                  {/* Up / Down buttons */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleSwapOrder(idx, "up")}
                      className="p-1 rounded-md text-[#5C6460] hover:bg-[#183D2B]/10 hover:text-[#183D2B] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      onClick={() => handleSwapOrder(idx, "down")}
                      className="p-1 rounded-md text-[#5C6460] hover:bg-[#183D2B]/10 hover:text-[#183D2B] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>

                  {/* Edit + Delete */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(brand)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#183D2B] bg-[#183D2B]/8 hover:bg-[#183D2B]/15 rounded-lg transition-colors"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(brand)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
        itemType="brand"
        warningNote="Products under this brand will have their brand association removed."
        isLoading={!!deleting}
      />
    </div>
  );
}
