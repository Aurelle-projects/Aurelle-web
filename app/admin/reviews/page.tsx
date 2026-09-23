"use client";

import React, { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import { Search, MessageSquare, RefreshCw, Trash2, Star, ExternalLink } from "lucide-react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { useAdminData, AdminReviewItem } from "@/context/AdminDataContext";

type ReviewItem = AdminReviewItem;

export default function AdminReviewsPage() {
  const {
    reviews: contextReviews,
    reviewsLoading,
    loadReviews,
    setReviews,
  } = useAdminData();

  const reviews = useMemo(() => contextReviews ?? [], [contextReviews]);
  const loading = contextReviews === null && reviewsLoading;
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleConfirmDelete() {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => (prev ? prev.filter((r) => r.id !== reviewToDelete.id) : null));
        setReviewToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete review.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return reviews;
    return reviews.filter((r) =>
      r.author_name.toLowerCase().includes(term) ||
      r.author_email.toLowerCase().includes(term) ||
      r.product_name.toLowerCase().includes(term) ||
      r.body.toLowerCase().includes(term)
    );
  }, [reviews, searchTerm]);

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Customer Reviews"
        subtitle="View and moderate all product reviews submitted by customers."
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-lg border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search by customer, product, or review text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => loadReviews(true)}
            title="Refresh reviews"
            className="h-8 w-8 flex items-center justify-center bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-[#5C6460] hover:text-[#183D2B] hover:bg-white transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs p-12 text-center">
            <div className="w-6 h-6 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
            <p className="text-xs text-[#5C6460]">Loading reviews from database…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F7F5EF] flex items-center justify-center mx-auto mb-3 text-[#A8B7A3]">
              <MessageSquare size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold text-[#1D211F] mb-1">No Reviews Yet</h3>
            <p className="text-xs text-[#5C6460]">
              Customer reviews will appear here once they are submitted.
            </p>
          </div>
        )}

        {/* No filter results */}
        {!loading && reviews.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs p-8 text-center">
            <p className="text-xs text-[#5C6460]">No reviews match your search.</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-xs font-bold text-[#183D2B] hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Reviews Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
            {/* Summary bar */}
            <div className="px-4 py-2.5 border-b border-[#DCCFB9]/40 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#5C6460]">
                Showing <strong className="text-[#1D211F]">{filtered.length}</strong> review{filtered.length !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px] font-semibold text-[#5C6460]">
                Avg rating:{" "}
                <strong className="text-[#1D211F]">
                  {filtered.length > 0
                    ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
                    : "—"}
                  &nbsp;★
                </strong>
              </p>
            </div>

            <div className="divide-y divide-[#DCCFB9]/40">
              {filtered.map((rev) => (
                <div key={rev.id} className="flex flex-col sm:flex-row sm:items-start gap-3.5 p-3.5 sm:p-4 hover:bg-[#F7F5EF]/50 transition-colors">
                  {/* Star badge */}
                  <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-amber-50 border border-amber-100">
                    <span className="text-xs font-bold text-amber-600">{rev.rating}</span>
                    <Star size={10} className="fill-amber-500 text-amber-500 ml-0.5 mb-0.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Stars row */}
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                        />
                      ))}
                    </div>

                    {rev.title && (
                      <p className="text-xs font-bold text-[#1D211F] mb-0.5">{rev.title}</p>
                    )}
                    <p className="text-xs text-[#4B534E] leading-relaxed break-words">{rev.body}</p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#5C6460]">
                      <span>
                        By <strong className="text-[#1D211F]">{rev.author_name}</strong>
                        {rev.author_email ? ` · ${rev.author_email}` : ""}
                      </span>
                      {rev.is_verified_purchase && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                          Verified Purchase
                        </span>
                      )}
                      <span>
                        {new Date(rev.created_at).toLocaleDateString("en-AE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Product + actions */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5 min-w-[150px]">
                    <Link
                      href={`/products/${rev.product_slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#183D2B] hover:underline truncate max-w-[150px]"
                    >
                      <ExternalLink size={10} />
                      {rev.product_name}
                    </Link>

                    <button
                      onClick={() => setReviewToDelete(rev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={11} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemType="review"
        itemName={reviewToDelete ? `Review by ${reviewToDelete.author_name} for ${reviewToDelete.product_name}` : undefined}
        description="Are you sure you want to permanently delete this customer review? It will be removed from the storefront immediately."
        isLoading={isDeleting}
      />
    </div>
  );
}
