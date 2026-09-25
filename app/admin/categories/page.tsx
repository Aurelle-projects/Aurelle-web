"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { useAdminData, AdminCategory } from "@/context/AdminDataContext";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  X,
  Loader2,
  FolderTree,
  Layers,
  Search,
  ExternalLink,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_wholesale?: boolean;
  subcategories_count?: number;
}

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const EMPTY_CAT_FORM = {
  name: "",
  slug: "",
  description: "",
  image_url: null as string | null,
  image_public_id: null as string | null,
  sort_order: 0,
  is_active: true,
  is_wholesale: true,
};

export default function AdminCategoriesPage() {
  const {
    categories: contextCategories,
    subcategories,
    categoriesLoading,
    loadCategories,
    setCategories,
  } = useAdminData();

  const categories = useMemo(() => contextCategories ?? [], [contextCategories]);
  const subcategoriesCount = subcategories?.length ?? 0;
  const loading = contextCategories === null && categoriesLoading;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Modal form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_CAT_FORM });

  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function showMsg(text: string, type: "success" | "error" | "info") {
    setMessage({ text, type });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(null), 4000);
  }

  function openCreate() {
    setForm({ ...EMPTY_CAT_FORM, sort_order: categories.length + 1, is_wholesale: true });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      image_url: cat.image_url,
      image_public_id: cat.image_public_id,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      is_wholesale: cat.is_wholesale ?? true,
    });
    setEditingId(cat.id);
    setShowModal(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: name === "sort_order" ? Number(value) : value,
        ...(name === "name" && !editingId ? { slug: slugify(value) } : {}),
      }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return showMsg("Category name is required.", "error");
    if (!form.slug.trim()) return showMsg("Slug is required.", "error");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        description: form.description.trim() || null,
        image_url: form.image_url,
        image_public_id: form.image_public_id,
        sort_order: form.sort_order,
        is_active: form.is_active,
        is_wholesale: form.is_wholesale,
        parent_id: null,
      };

      const res = await fetch("/api/admin/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to save category.");

      showMsg(editingId ? "Category updated successfully." : "Category created successfully.", "success");
      setShowModal(false);
      await loadCategories();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showMsg(err?.message || "Failed to save category.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to delete category.");

      setCategories((prev) => (prev ? prev.filter((c) => c.id !== id) : null));
      showMsg(`Category "${name}" deleted successfully.`, "success");
      setDeleteTarget(null);
      await loadCategories(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showMsg(err?.message || "Failed to delete category.", "error");
    } finally {
      setDeleting(null);
    }
  }

  const filteredCategories = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term)
    );
  }, [categories, search]);

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="Category Management"
        subtitle="Manage main categories. Create and organize top-level categories fetched directly from database."
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Navigation Tabs (Categories vs Subcategories) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#183D2B]/10 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F0EBE1] rounded-lg">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#183D2B] text-white shadow-2xs transition-all"
            >
              <Layers size={14} />
              <span>Categories ({categories.length})</span>
            </button>
            <Link
              href="/admin/subcategories"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#5C6460] hover:text-[#183D2B] hover:bg-white/60 transition-all"
            >
              <FolderTree size={14} />
              <span>Subcategories ({subcategoriesCount})</span>
            </Link>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] hover:bg-[#122e20] text-white text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Category</span>
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : message.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {message.type === "success" ? (
              <Check size={15} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={15} className="shrink-0 text-red-600" />
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6460]" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#183D2B]/20 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#183D2B]"
          />
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#5C6460] space-y-2">
            <Loader2 size={24} className="animate-spin text-[#183D2B]" />
            <p className="text-xs font-medium">Loading categories from database...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#183D2B]/10 p-8 text-center max-w-md mx-auto space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-[#183D2B]/5 rounded-xl flex items-center justify-center mx-auto text-[#183D2B]">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">No categories found</h3>
              <p className="text-[11px] text-[#5C6460] mt-0.5">
                {search ? "No categories matched your search criteria." : "Get started by adding your first category."}
              </p>
            </div>
            {!search && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] text-white text-xs font-semibold rounded-md cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Category</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#183D2B]/10 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#183D2B]/10 text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">
                    <th className="py-2.5 px-3.5 w-14">Image</th>
                    <th className="py-2.5 px-3.5">Category Name</th>
                    <th className="py-2.5 px-3.5">Subcategories</th>
                    <th className="py-2.5 px-3.5">Sort Order</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#183D2B]/5 text-xs">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-2.5 px-3.5">
                        <div className="w-10 h-10 rounded-lg bg-[#F0EBE1] overflow-hidden border border-[#183D2B]/10 flex items-center justify-center relative shrink-0">
                          {cat.image_url ? (
                            <Image
                              src={cat.image_url}
                              alt={cat.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Layers size={15} className="text-[#5C6460]/40" />
                          )}
                        </div>
                      </td>

                      {/* Name & Description */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-xs text-[#1A1A1A]">{cat.name}</div>
                        {cat.description && (
                          <p className="text-[11px] text-[#5C6460] line-clamp-1 mt-0.5 max-w-xs">
                            {cat.description}
                          </p>
                        )}
                      </td>

                      {/* Subcategories count link */}
                      <td className="py-2.5 px-3.5">
                        <Link
                          href={`/admin/subcategories?category=${cat.id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#183D2B]/10 hover:bg-[#183D2B]/20 text-[#183D2B] text-[11px] font-semibold transition-colors"
                        >
                          <span>{cat.subcategories_count ?? 0} subcategories</span>
                          <ExternalLink size={10} />
                        </Link>
                      </td>

                      {/* Sort Order */}
                      <td className="py-2.5 px-3.5 text-[11px] font-semibold text-[#5C6460]">
                        #{cat.sort_order}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              cat.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cat.is_active ? "Active" : "Inactive"}
                          </span>
                          {cat.is_wholesale !== false && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#183D2B]/10 text-[#183D2B]">
                              Wholesale
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 text-[#5C6460] hover:text-[#183D2B] hover:bg-[#183D2B]/10 rounded transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#183D2B]/10 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#183D2B]/10 pb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">
                {editingId ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Cosmetics & Makeup, Skincare, Hair Care"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#183D2B]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#183D2B]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="e.g. cosmetics-makeup"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#183D2B]/20 bg-[#FAF8F5] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#183D2B]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of products in this category..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#183D2B]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#183D2B]"
                />
              </div>



              {/* Category Image Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-1.5">
                  Category Image
                </label>
                <CloudinaryUploader
                  label="Category Cover Image"
                  description="Upload a representative banner or icon for this category."
                  aspectRatio="square"
                  folder="categories"
                  value={form.image_url || undefined}
                  publicId={form.image_public_id || undefined}
                  onUploadSuccess={(asset: CloudinaryAsset) => {
                    setForm((prev) => ({
                      ...prev,
                      image_url: asset.secure_url,
                      image_public_id: asset.public_id,
                    }));
                  }}
                  onRemove={() => {
                    setForm((prev) => ({
                      ...prev,
                      image_url: null,
                      image_public_id: null,
                    }));
                  }}
                />
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={form.sort_order}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#183D2B]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#183D2B]"
                  />
                </div>

                <div className="flex flex-col justify-end gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B] accent-[#183D2B]"
                    />
                    <span className="text-sm font-semibold text-[#1A1A1A]">Is Active</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_wholesale"
                      checked={form.is_wholesale}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B] accent-[#183D2B]"
                    />
                    <span className="text-sm font-semibold text-[#1A1A1A]">Available on Wholesale Website</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#183D2B]/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5C6460] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] hover:bg-[#122e20] text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingId ? "Save Changes" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
        itemType="category"
        warningNote="Deleting this category will also remove any subcategories assigned to it and unlink any products."
        isLoading={!!deleting}
      />
    </div>
  );
}
