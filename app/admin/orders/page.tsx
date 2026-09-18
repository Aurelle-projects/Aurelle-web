"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Search, Package, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  items_count: number;
  total_amount: number;
  payment_status: "paid" | "pending" | "failed";
  order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  city: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("orders")
        .select(
          "id, order_number, customer_name, customer_email, items_count, total_amount, payment_status, order_status, created_at, city"
        )
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setOrders(data as OrderItem[]);
      } else {
        setOrders([]); // Empty — no sample data shown
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: OrderItem["order_status"]) {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, order_status: newStatus } : o))
    );
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("orders")
        .update({ order_status: newStatus })
        .eq("id", id);
    } catch {
      // Silently fail — optimistic already applied
    }
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const STATUS_COLORS: Record<string, string> = {
    delivered: "bg-emerald-100 text-emerald-800",
    shipped: "bg-blue-100 text-blue-800",
    processing: "bg-amber-100 text-amber-800",
    pending: "bg-neutral-100 text-neutral-700",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Customer Orders"
        subtitle="Track UAE retail deliveries, payment settlements, and fulfillment status."
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6460]" />
            <input
              type="text"
              placeholder="Search by order #, customer, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={loadOrders}
              title="Refresh orders"
              className="h-10 w-10 flex items-center justify-center bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-[#5C6460] hover:text-[#183D2B] hover:bg-white transition-colors"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs p-16 text-center">
            <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#5C6460]">Loading orders from database…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F7F5EF] flex items-center justify-center mx-auto mb-4 text-[#A8B7A3]">
              <Package size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-[#1D211F] mb-1">No Orders Yet</h3>
            <p className="text-sm text-[#5C6460]">
              Orders placed through the storefront will appear here once customers start purchasing.
            </p>
          </div>
        )}

        {/* No filter results */}
        {!loading && orders.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs p-10 text-center">
            <p className="text-sm text-[#5C6460]">No orders match your current filters.</p>
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
              className="mt-3 text-xs font-bold text-[#183D2B] hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Orders Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-xl border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
            {/* Summary bar */}
            <div className="px-5 py-3 border-b border-[#DCCFB9]/40 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#5C6460]">
                Showing <strong className="text-[#1D211F]">{filtered.length}</strong> orders
              </p>
              <div className="flex gap-4 text-xs font-semibold text-[#5C6460]">
                <span>
                  Revenue:{" "}
                  <strong className="text-[#1D211F]">
                    AED {filtered.reduce((s, o) => s + o.total_amount, 0).toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F5EF] border-b border-[#DCCFB9]/60 text-[11px] font-bold text-[#5C6460] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Total (AED)</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Fulfillment</th>
                    <th className="py-3.5 px-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCCFB9]/40 text-sm">
                  {filtered.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F7F5EF]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#183D2B]">
                        {ord.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[13px] text-[#1D211F]">{ord.customer_name}</p>
                        <span className="text-xs text-[#5C6460]">{ord.customer_email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#1D211F]">
                        {ord.city}, UAE
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5C6460]">
                        {ord.items_count ?? "—"} items
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1D211F]">
                        AED {(ord.total_amount ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          ord.payment_status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.payment_status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[ord.order_status] ?? "bg-neutral-100 text-neutral-700"}`}>
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={ord.order_status}
                          onChange={(e) =>
                            handleStatusChange(ord.id, e.target.value as OrderItem["order_status"])
                          }
                          className="h-8 px-2 bg-[#F7F5EF] border border-[#DCCFB9] rounded text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
