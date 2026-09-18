"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Check, X, Clock, Search, Building2, User, Phone, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WholesaleApp {
  id: string;
  company_name: string;
  trade_license_number: string;
  contact_person: string;
  email: string;
  phone: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  created_at: string;
}

const SAMPLE_APPLICATIONS: WholesaleApp[] = [
  {
    id: "app-1",
    company_name: "Al Manara Pharmacy LLC",
    trade_license_number: "CN-1029384",
    contact_person: "Tariq Mansoor",
    email: "procurement@almanara.ae",
    phone: "+971 50 123 4567",
    status: "pending",
    created_at: "2026-09-15T10:00:00Z",
  },
  {
    id: "app-2",
    company_name: "Glow & Co Beauty Salons",
    trade_license_number: "DXB-8839201",
    contact_person: "Noura Al-Sayed",
    email: "supply@glowandco.ae",
    phone: "+971 52 987 6543",
    status: "under_review",
    created_at: "2026-09-14T14:30:00Z",
  },
  {
    id: "app-3",
    company_name: "Emirates Luxury Retail FZE",
    trade_license_number: "SHJ-5561029",
    contact_person: "Rashid Khalifa",
    email: "rashid@elr.ae",
    phone: "+971 55 334 2211",
    status: "approved",
    created_at: "2026-09-10T09:15:00Z",
  },
];

export default function AdminWholesalePage() {
  const [applications, setApplications] = useState<WholesaleApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { loadApplications(); }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("wholesale_applications")
        .select("id, company_name, trade_license_number, contact_person, email, phone, status, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) setApplications(data as WholesaleApp[]);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: WholesaleApp["status"]) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("wholesale_applications")
        .update({ status: newStatus })
        .eq("id", id);
    } catch {
      // Local state fallback
    }
  }

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.trade_license_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="B2B Wholesale Trade Applications"
        subtitle="Verify UAE trade licenses, evaluate retail partners, and authorize wholesale trade pricing."
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search by company name, contact, or trade license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCCFB9]/60 text-[11px] font-bold text-[#5C6460] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company & License</th>
                  <th className="py-3.5 px-4">Contact Representative</th>
                  <th className="py-3.5 px-4">Phone / Email</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCCFB9]/40 text-sm">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F7F5EF]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1D211F]">{app.company_name}</p>
                          <span className="text-xs font-mono text-[#5C6460]">License: {app.trade_license_number}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#1D211F] font-medium">
                        <User size={14} className="text-[#5C6460]" />
                        <span>{app.contact_person}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div className="flex items-center gap-1 text-[#5C6460]">
                        <Mail size={12} />
                        <span>{app.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#5C6460]">
                        <Phone size={12} />
                        <span>{app.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#5C6460]">
                      {new Date(app.created_at).toLocaleDateString("en-AE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          app.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "under_review"
                            ? "bg-blue-100 text-blue-800"
                            : app.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(app.id, "approved")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                            title="Approve Trade Account"
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                        )}
                        {app.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(app.id, "under_review")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Set Under Review"
                          >
                            <Clock size={12} />
                            <span>Review</span>
                          </button>
                        )}
                        {app.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(app.id, "rejected")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-neutral-200 hover:bg-red-100 text-red-700 rounded transition-colors"
                            title="Reject Application"
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
