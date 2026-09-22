"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import { Search, MessageSquare, RefreshCw, Trash2, Star, ExternalLink } from "lucide-react";

interface ReviewItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  author_name: string;
  author_email: string;
  rating: number;
  title: string | null;
  body: string;
  is_published: boolean;
  is_verified_purchase: boolean;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (res.ok && data.reviews) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("[AdminReviewsPage] load error:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete review.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = reviews.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.author_name.toLowerCase().includes(term) ||
      r.author_email.toLowerCase().includes(term) ||
      r.product_name.toLowerCase().includes(term) ||
      r.body.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Customer Reviews"
        subtitle="View and moderate all product reviews submitted by customers."
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search by customer, product, or review text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
            />
          </div>
          <button
            onClick={loadReviews}
            title="Refresh reviews"
            className="h-10 w-10 flex items-center justify-center bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-[#5C6460] hover:text-[#183D2B] hover:bg-white transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs p-16 text-center">
            <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#5C6460]">Loading reviews from database…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F7F5EF] flex items-center justify-center mx-auto mb-4 text-[#A8B7A3]">
              <MessageSquare size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-[#1D211F] mb-1">No Reviews Yet</h3>
            <p className="text-sm text-[#5C6460]">
              Customer reviews will appear here once they are submitted.
            </p>
          </div>
        )}

        {/* No filter results */}
        {!loading && reviews.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs p-10 text-center">
            <p className="text-sm text-[#5C6460]">No reviews match your search.</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-3 text-xs font-bold text-[#183D2B] hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Reviews Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
            {/* Summary bar */}
            <div className="px-5 py-3 border-b border-[#DCCFB9]/40 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#5C6460]">
                Showing <strong className="text-[#1D211F]">{filtered.length}</strong> review{filtered.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs font-semibold text-[#5C6460]">
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
                <div key={rev.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 hover:bg-[#F7F5EF]/50 transition-colors">
                  {/* Star badge */}
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-amber-50 border border-amber-100">
                    <span className="text-sm font-bold text-amber-600">{rev.rating}</span>
                    <Star size={11} className="fill-amber-500 text-amber-500 ml-0.5 mb-0.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Stars row */}
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                        />
                      ))}
                    </div>

                    {rev.title && (
                      <p className="text-[13px] font-bold text-[#1D211F] mb-0.5">{rev.title}</p>
                    )}
                    <p className="text-sm text-[#4B534E] leading-relaxed break-words">{rev.body}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#5C6460]">
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
                  <div className="flex-shrink-0 flex flex-col items-end gap-2 min-w-[160px]">
                    <Link
                      href={`/products/${rev.product_slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#183D2B] hover:underline truncate max-w-[160px]"
                    >
                      <ExternalLink size={11} />
                      {rev.product_name}
                    </Link>

                    <button
                      onClick={() => handleDelete(rev.id)}
                      disabled={deletingId === rev.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold border border-red-100 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={12} />
                      {deletingId === rev.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
