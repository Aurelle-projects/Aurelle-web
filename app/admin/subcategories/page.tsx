"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { useAdminData, AdminCategory, AdminSubcategory } from "@/context/AdminDataContext";
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
  Filter,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string;
  sort_order: number;
  is_active: boolean;
  parent_name?: string;
}

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const EMPTY_SUB_FORM = {
  parent_id: "",
  name: "",
  slug: "",
  sort_order: 0,
  is_active: true,
};

function SubcategoriesContent() {
  const searchParams = useSearchParams();
  const initialCategoryFilter = searchParams.get("category") || "all";

  const {
    categories: contextCategories,
    subcategories: contextSubcategories,
    categoriesLoading,
    loadCategories,
    setSubcategories,
  } = useAdminData();

  const categories = useMemo(() => contextCategories ?? [], [contextCategories]);
  const subcategories = useMemo(() => contextSubcategories ?? [], [contextSubcategories]);
  const loading = (contextCategories === null || contextSubcategories === null) && categoriesLoading;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subcategory | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryFilter);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Modal form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_SUB_FORM });

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
    const defaultParentId = selectedCategory !== "all" ? selectedCategory : (categories[0]?.id ?? "");
    setForm({
      ...EMPTY_SUB_FORM,
      parent_id: defaultParentId,
      sort_order: subcategories.length + 1,
    });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(sub: Subcategory) {
    setForm({
      parent_id: sub.parent_id,
      name: sub.name,
      slug: sub.slug,
      sort_order: sub.sort_order,
      is_active: sub.is_active,
    });
    setEditingId(sub.id);
    setShowModal(true);
  }


  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
    if (!form.parent_id) return showMsg("Please select a parent category.", "error");
    if (!form.name.trim()) return showMsg("Subcategory name is required.", "error");
    if (!form.slug.trim()) return showMsg("Slug is required.", "error");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        parent_id: form.parent_id,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      const res = await fetch("/api/admin/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to save subcategory.");

      showMsg(editingId ? "Subcategory updated successfully." : "Subcategory created successfully.", "success");
      setShowModal(false);
      await loadCategories(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showMsg(err?.message || "Failed to save subcategory.", "error");
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
      if (!res.ok || result.error) throw new Error(result.error || "Failed to delete subcategory.");

      setSubcategories((prev) => (prev ? prev.filter((s) => s.id !== id) : null));
      showMsg(`Subcategory "${name}" deleted successfully.`, "success");
      setDeleteTarget(null);
      await loadCategories(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showMsg(err?.message || "Failed to delete subcategory.", "error");
    } finally {
      setDeleting(null);
    }
  }

  const filteredSubcategories = useMemo(() => {
    const term = search.toLowerCase().trim();
    return subcategories.filter((s) => {
      const matchesCategory = selectedCategory === "all" || s.parent_id === selectedCategory;
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [subcategories, selectedCategory, search]);

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="Subcategory Management"
        subtitle="Create, edit, and organize subcategories under their parent categories. All data is fetched from database."
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#183D2B]/10 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F0EBE1] rounded-lg">
            <Link
              href="/admin/categories"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#5C6460] hover:text-[#183D2B] hover:bg-white/60 transition-all"
            >
              <Layers size={14} />
              <span>Categories ({categories.length})</span>
            </Link>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#183D2B] text-white shadow-2xs transition-all"
            >
              <FolderTree size={14} />
              <span>Subcategories ({subcategories.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] hover:bg-[#122e20] text-white text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Subcategory</span>
            </button>
          </div>
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

        {/* Filters: Search & Category Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search subcategories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#183D2B]/20 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#183D2B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#5C6460] shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#183D2B]/20 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#183D2B] font-medium text-[#1A1A1A] cursor-pointer"
            >
              <option value="all">All Categories ({subcategories.length})</option>
              {categories.map((cat) => {
                const count = subcategories.filter((s) => s.parent_id === cat.id).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#5C6460] space-y-2">
            <Loader2 size={24} className="animate-spin text-[#183D2B]" />
            <p className="text-xs font-medium">Loading subcategories from database...</p>
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#183D2B]/10 p-8 text-center max-w-md mx-auto space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-[#183D2B]/5 rounded-xl flex items-center justify-center mx-auto text-[#183D2B]">
              <FolderTree size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">No subcategories found</h3>
              <p className="text-[11px] text-[#5C6460] mt-0.5">
                {search || selectedCategory !== "all"
                  ? "No subcategories matched your filter criteria."
                  : "Get started by adding your first subcategory."}
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] text-white text-xs font-semibold rounded-md cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Subcategory</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#183D2B]/10 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#183D2B]/10 text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">
                    <th className="py-2.5 px-3.5">Subcategory Name</th>
                    <th className="py-2.5 px-3.5">Parent Category</th>
                    <th className="py-2.5 px-3.5">Sort Order</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#183D2B]/5 text-xs">
                  {filteredSubcategories.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Name */}
                      <td className="py-2.5 px-3.5 font-semibold text-xs text-[#1A1A1A]">
                        {sub.name}
                      </td>

                      {/* Parent Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#183D2B]/10 text-[#183D2B] text-xs font-semibold">
                          <Layers size={12} />
                          <span>{sub.parent_name}</span>
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#5C6460]">
                        #{sub.sort_order}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            sub.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {sub.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(sub)}
                            className="p-2 text-[#5C6460] hover:text-[#183D2B] hover:bg-[#183D2B]/10 rounded-lg transition-colors"
                            title="Edit Subcategory"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(sub)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Subcategory"
                          >
                            <Trash2 size={15} />
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

      {/* Create / Edit Subcategory Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#183D2B]/10 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#183D2B]/10 pb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">
                {editingId ? "Edit Subcategory" : "Add New Subcategory"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Dropdown List (Parent Category) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="parent_id"
                  value={form.parent_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#183D2B]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#183D2B] font-medium text-[#1A1A1A]"
                >
                  <option value="">-- Select Parent Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#5C6460] mt-1">
                  Choose which category this subcategory belongs to.
                </p>
              </div>

              {/* Subcategory Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-1.5">
                  Subcategory Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Face Wash, Lip Care, Shampoo, Serums"
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
                  placeholder="e.g. face-wash"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#183D2B]/20 bg-[#FAF8F5] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#183D2B]"
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

                <div className="flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 cursor-pointer pb-2.5">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-[#183D2B] focus:ring-[#183D2B] accent-[#183D2B]"
                    />
                    <span className="text-sm font-semibold text-[#1A1A1A]">Is Active</span>
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
                  <span>{editingId ? "Save Changes" : "Create Subcategory"}</span>
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
        itemType="subcategory"
        warningNote="Any products assigned to this subcategory will have their subcategory unlinked."
        isLoading={!!deleting}
      />
    </div>
  );
}

export default function AdminSubcategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-[#183D2B]" />
        </div>
      }
    >
      <SubcategoriesContent />
    </Suspense>
  );
}
