"use client";

import React, { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import { Search, Package, RefreshCw, Building2, ShoppingBag, Eye } from "lucide-react";
import { useAdminData, AdminOrderItem } from "@/context/AdminDataContext";

type OrderItem = AdminOrderItem;

export default function AdminOrdersPage() {
  const {
    orders: contextOrders,
    ordersLoading,
    loadOrders,
    setOrders,
    products,
    loadProducts,
  } = useAdminData();

  const orders = useMemo(() => contextOrders ?? [], [contextOrders]);
  const loading = contextOrders === null && ordersLoading;
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | "retail" | "wholesale">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [loadOrders, loadProducts]);

  function getOrderThumbnail(ord: OrderItem): string | null {
    const firstItem = ord.items?.[0];
    if (!firstItem) return null;
    if (firstItem.image) return firstItem.image;
    if (firstItem.product_id && products) {
      const match = products.find((p) => p.id === firstItem.product_id);
      if (match?.image_url) return match.image_url;
    }
    return null;
  }

  async function handleStatusChange(id: string, newStatus: OrderItem["order_status"]) {
    // Optimistic update
    setOrders((prev) =>
      prev ? prev.map((o) => (o.id === id ? { ...o, order_status: newStatus } : o)) : null
    );
    setSelectedOrder((prev) =>
      prev && prev.id === id ? { ...prev, order_status: newStatus } : prev
    );
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        console.error("[AdminOrdersPage] Failed to update status on server");
      }
    } catch (err) {
      console.error("[AdminOrdersPage] Status change network error:", err);
    }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return orders.filter((o) => {
      const matchesChannel =
        channelFilter === "all" || o.customer_type === channelFilter;
      const matchesSearch =
        !term ||
        o.order_number?.toLowerCase().includes(term) ||
        o.customer_name?.toLowerCase().includes(term) ||
        o.customer_email?.toLowerCase().includes(term) ||
        o.city?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || o.order_status === statusFilter;
      return matchesChannel && matchesSearch && matchesStatus;
    });
  }, [orders, channelFilter, searchTerm, statusFilter]);

  const STATUS_COLORS: Record<string, string> = {
    delivered: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    shipped: "bg-blue-50 text-blue-800 border border-blue-200",
    processing: "bg-amber-50 text-amber-800 border border-amber-200",
    pending: "bg-neutral-100 text-neutral-700 border border-neutral-200",
    cancelled: "bg-red-50 text-red-800 border border-red-200",
  };

  const { retailCount, wholesaleCount } = useMemo(() => {
    let r = 0;
    let w = 0;
    for (const o of orders) {
      if (o.customer_type === "retail") r++;
      else if (o.customer_type === "wholesale") w++;
    }
    return { retailCount: r, wholesaleCount: w };
  }, [orders]);

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Orders"
        subtitle="Track UAE retail deliveries and B2B wholesale orders, payment settlements, and fulfillment status."
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Channel Selection & Filter Bar */}
        <div className="bg-white p-3.5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
          {/* Channel Tabs */}
          <div className="flex items-center gap-1.5 border-b border-[#DCCFB9]/30 pb-2.5">
            <span className="text-[11px] font-bold text-[#5C6460] mr-1.5">Channel:</span>
            <button
              type="button"
              onClick={() => setChannelFilter("all")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                channelFilter === "all"
                  ? "bg-[#183D2B] text-white shadow-2xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-[#1D211F]"
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter("retail")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                channelFilter === "retail"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-emerald-800"
              }`}
            >
              <ShoppingBag size={12} />
              <span>Retail ({retailCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter("wholesale")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                channelFilter === "wholesale"
                  ? "bg-amber-800 text-white shadow-2xs"
                  : "bg-[#F7F5EF] text-[#5C6460] hover:text-amber-900"
              }`}
            >
              <Building2 size={12} />
              <span>Wholesale B2B ({wholesaleCount})</span>
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6460]" />
              <input
                type="text"
                placeholder="Search order #, customer, city, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={() => loadOrders(true)}
                title="Refresh orders"
                className="h-8 w-8 flex items-center justify-center bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-[#5C6460] hover:text-[#183D2B] hover:bg-white transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs p-12 text-center">
            <div className="w-6 h-6 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
            <p className="text-xs text-[#5C6460]">Loading orders from database…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F7F5EF] flex items-center justify-center mx-auto mb-3 text-[#A8B7A3]">
              <Package size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold text-[#1D211F] mb-1">No Orders Yet</h3>
            <p className="text-xs text-[#5C6460]">
              Orders placed through the storefront or wholesale portal will appear here once customers start purchasing.
            </p>
          </div>
        )}

        {/* No filter results */}
        {!loading && orders.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs p-8 text-center">
            <p className="text-xs text-[#5C6460]">No orders match your current filters.</p>
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("all"); setChannelFilter("all"); }}
              className="mt-2 text-xs font-bold text-[#183D2B] hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Orders Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
            {/* Summary bar */}
            <div className="px-4 py-2.5 border-b border-[#DCCFB9]/40 flex items-center justify-between text-xs">
              <p className="text-[11px] font-semibold text-[#5C6460]">
                Showing <strong className="text-[#1D211F]">{filtered.length}</strong> orders
              </p>
              <div className="flex gap-4 text-[11px] font-semibold text-[#5C6460]">
                <span>
                  Total Volume:{" "}
                  <strong className="text-[#1D211F]">
                    AED {filtered.reduce((s, o) => s + o.total_amount, 0).toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F5EF] border-b border-[#DCCFB9]/60 text-[10px] font-bold text-[#5C6460] uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">Order #</th>
                    <th className="py-2.5 px-3.5">Channel</th>
                    <th className="py-2.5 px-3.5">Customer</th>
                    <th className="py-2.5 px-3.5">Product</th>
                    <th className="py-2.5 px-3.5 text-center">View</th>
                    <th className="py-2.5 px-3.5">Total (AED)</th>
                    <th className="py-2.5 px-3.5">Payment</th>
                    <th className="py-2.5 px-3.5">Fulfillment</th>
                    <th className="py-2.5 px-3.5 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCCFB9]/30 text-xs">
                  {filtered.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F7F5EF]/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-xs text-[#183D2B]">
                        {ord.order_number}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {ord.customer_type === "wholesale" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                            <Building2 size={9} />
                            <span>Wholesale</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShoppingBag size={9} />
                            <span>Retail</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <p className="font-semibold text-xs text-[#1D211F]">{ord.customer_name}</p>
                        <span className="text-[10px] text-[#5C6460]">{ord.customer_email}</span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        {(() => {
                          const thumb = getOrderThumbnail(ord);
                          const firstItemName = ord.items?.[0]?.name || "Order item";
                          return (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(ord)}
                                title={`View details for ${firstItemName}`}
                                className="group relative cursor-pointer block"
                              >
                                {thumb ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={thumb}
                                    alt={firstItemName}
                                    className="w-9 h-9 rounded object-cover border border-[#DCCFB9]/60 shrink-0 group-hover:border-[#183D2B] transition-colors"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0 group-hover:border-[#183D2B] group-hover:text-[#183D2B] transition-colors">
                                    <Package size={15} />
                                  </div>
                                )}
                              </button>
                              {ord.items && ord.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(ord)}
                                  title={`${ord.items.length} items total — Click to view`}
                                  className="text-[9.5px] font-bold text-[#5C6460] bg-[#F7F5EF] border border-[#DCCFB9]/60 px-1 py-0.5 rounded cursor-pointer hover:bg-white hover:text-[#183D2B] transition-colors"
                                >
                                  +{ord.items.length - 1}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          title="View Order Details"
                          className="p-1.5 text-[#5C6460] hover:text-[#183D2B] hover:bg-[#183D2B]/10 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#1D211F]">
                        AED {(ord.total_amount ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            ord.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.payment_status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                            STATUS_COLORS[ord.order_status] || "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <select
                          value={ord.order_status}
                          onChange={(e) =>
                            handleStatusChange(ord.id, e.target.value as OrderItem["order_status"])
                          }
                          className="text-[11px] bg-[#F7F5EF] border border-[#DCCFB9] rounded px-1.5 py-0.5 text-[#1D211F] font-medium outline-none cursor-pointer hover:bg-white transition-colors"
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

      {/* Order Details Popup Box */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        products={products}
      />
    </div>
  );
}
