"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  MessageSquare,
  Search,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  MessageCircle,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

interface EnquiryItem {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  business_type: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  created_at: string;
  country?: string | null;
  expected_order_volume?: string | null;
  notes?: string | null;
}

export default function AdminB2BEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingEnquiry, setViewingEnquiry] = useState<EnquiryItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, []);

  async function loadEnquiries() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wholesale", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.enquiries)) {
        setEnquiries(json.enquiries);
      }
    } catch (err) {
      console.error("Failed to load B2B enquiries:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateEnquiryStatus(id: string, newStatus: EnquiryItem["status"]) {
    try {
      const res = await fetch("/api/admin/wholesale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (viewingEnquiry?.id === id) {
          setViewingEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        setFeedback("Enquiry status updated successfully.");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update enquiry status:", err);
    }
  }

  function getWhatsAppNumber(item: EnquiryItem): string {
    if (item.notes) {
      const match = item.notes.match(/WhatsApp:\s*([^\n\r]+)/i);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    return item.phone || "";
  }

  const filtered = enquiries.filter((item) => {
    const matchesSearch =
      item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs">
            <CheckCircle2 size={11} /> Responded
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs">
            <Clock size={11} /> In Progress
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs">
            <XCircle size={11} /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs">
            <Clock size={11} /> New Enquiry
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="B2B Trade Enquiries"
        subtitle="Review and respond to incoming wholesale product inquiries, pricing requests, and commercial distribution questions."
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {feedback && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-sm text-xs font-semibold">
            {feedback}
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-sm border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search enquiries by name, company, email, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F7F5EF] border border-[#DCCFB9] rounded-sm text-sm text-[#1D211F] outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-sm text-xs font-semibold text-[#1D211F] outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Enquiries ({enquiries.length})</option>
              <option value="pending">New</option>
              <option value="under_review">In Progress</option>
              <option value="approved">Responded</option>
              <option value="rejected">Closed</option>
            </select>
          </div>
        </div>

        {/* Enquiry List */}
        {loading ? (
          <div className="py-20 text-center text-[#5C6460]">Loading trade enquiries...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-sm border border-[#DCCFB9]/60 text-center text-[#5C6460] space-y-2">
            <MessageSquare size={36} className="mx-auto text-[#8E9590]" />
            <p className="font-semibold text-sm">No B2B enquiries found</p>
            <p className="text-xs text-[#8E9590]">Inquiries submitted from the wholesale contact form or product page will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE0]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-[#14231B]">{item.company_name}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#5C6460] flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={13} className="text-[#8E9590]" />
                        <strong className="text-[#1D211F]">{item.contact_person}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={13} className="text-[#8E9590]" />
                        <span>{item.email}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-[#8E9590]" />
                        <span>{item.phone}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-[#8E9590]">
                        <Calendar size={12} />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                    {/* WhatsApp */}
                    {(() => {
                      const wa = getWhatsAppNumber(item);
                      const cleanWa = wa.replace(/\D/g, "");
                      return (
                        <a
                          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                            `Hello ${item.contact_person}, this is Aurelle B2B Wholesale regarding your enquiry for ${item.company_name}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-sm bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </a>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => setViewingEnquiry(item)}
                      className="px-3 py-1.5 rounded-sm bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[#14231B] border border-[#DCCFB9] text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>View Message</span>
                    </button>

                    <select
                      value={item.status}
                      onChange={(e) => updateEnquiryStatus(item.id, e.target.value as EnquiryItem["status"])}
                      className="h-8 px-2 bg-[#FAF8F5] border border-[#DCCFB9] rounded-sm text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
                    >
                      <option value="pending">Mark New</option>
                      <option value="under_review">In Progress</option>
                      <option value="approved">Mark Responded</option>
                      <option value="rejected">Mark Closed</option>
                    </select>
                  </div>
                </div>

                {/* Enquiry Notes / Message Preview */}
                {item.notes && (
                  <div className="bg-[#FAF8F5] p-3.5 rounded-sm border border-[#EDE9DF] text-xs text-[#2D3330] whitespace-pre-line leading-relaxed">
                    {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {viewingEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-xl w-full border border-[#DCCFB9] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-[#EFEAE0] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#183D2B]" />
                <h3 className="font-bold text-base text-[#14231B]">
                  Enquiry: {viewingEnquiry.company_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingEnquiry(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF8F5] rounded-sm border border-[#EDE9DF]">
                <div>
                  <span className="text-[#8E9590] block text-[10px] uppercase font-bold">Contact Person</span>
                  <span className="font-semibold text-xs text-[#14231B]">{viewingEnquiry.contact_person}</span>
                </div>
                <div>
                  <span className="text-[#8E9590] block text-[10px] uppercase font-bold">Email</span>
                  <span className="font-semibold text-xs text-[#14231B]">{viewingEnquiry.email}</span>
                </div>
                <div>
                  <span className="text-[#8E9590] block text-[10px] uppercase font-bold">Phone</span>
                  <span className="font-semibold text-xs text-[#14231B]">{viewingEnquiry.phone}</span>
                </div>
                <div>
                  <span className="text-[#8E9590] block text-[10px] uppercase font-bold">Date Submitted</span>
                  <span className="font-semibold text-xs text-[#14231B]">
                    {new Date(viewingEnquiry.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8E9590] mb-2">
                  Enquiry Message &amp; Requirements
                </h4>
                <div className="bg-[#FAF8F5] p-4 rounded-sm border border-[#EDE9DF] space-y-1.5 whitespace-pre-line leading-relaxed text-xs text-[#2D3330]">
                  {viewingEnquiry.notes || "No additional message details provided."}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#EFEAE0] bg-[#FAF8F5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingEnquiry(null)}
                className="px-4 py-2 rounded-sm bg-white border border-[#DCCFB9] text-xs font-bold text-[#5C6460]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
