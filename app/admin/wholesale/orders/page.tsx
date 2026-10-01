"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import { Search, Package, RefreshCw, Building2, ShoppingBag, Eye, ShieldCheck } from "lucide-react";
import { useAdminData, AdminOrderItem } from "@/context/AdminDataContext";
import { formatPrice } from "@/utils/price";

type OrderItem = AdminOrderItem;

function WholesaleOrdersContent() {
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [loadOrders, loadProducts]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

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
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: `Status update failed: ${data.error || "Server error"}`,
        });
      } else {
        setFeedback({
          type: "success",
          text: `Order status updated to ${newStatus}.`,
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error updating order status." });
    }
  }

  // Filter ONLY wholesale orders
  const wholesaleOrders = useMemo(() => {
    return orders.filter((o) => {
      const type = (o.customer_type || "").toLowerCase();
      return type === "wholesale" || o.order_number?.startsWith("AUR-WS");
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return wholesaleOrders.filter((ord) => {
      // Status filter
      if (statusFilter !== "all" && ord.order_status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const num = (ord.order_number || "").toLowerCase();
        const name = (ord.shipping_address?.full_name || ord.customer_name || "").toLowerCase();
        const email = (ord.shipping_address?.email || ord.customer_email || "").toLowerCase();
        const comp = ((ord.shipping_address as any)?.company_name || "").toLowerCase();
        const phone = (ord.shipping_address?.phone || "").toLowerCase();

        return (
          num.includes(term) ||
          name.includes(term) ||
          email.includes(term) ||
          comp.includes(term) ||
          phone.includes(term)
        );
      }
      return true;
    });
  }, [wholesaleOrders, statusFilter, searchTerm]);

  return (
    <div className="p-6 space-[#183D2B] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFEAE0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#183D2B] text-white px-2 py-0.5 rounded-xs">
              B2B Wholesale Portal
            </span>
            <span className="text-xs text-[#5C6460] font-semibold">{wholesaleOrders.length} total wholesale orders</span>
          </div>
          <h1 className="text-2xl font-bold text-[#14231B] mt-1 flex items-center gap-2">
            <Building2 size={24} className="text-[#183D2B]" />
            <span>Dedicated B2B Wholesale Orders</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => loadOrders()}
          disabled={ordersLoading}
          className="px-3.5 py-2 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#14231B] hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={ordersLoading ? "animate-spin" : ""} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs font-bold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg border border-[#EFEAE0] shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9590]" />
          <input
            type="text"
            placeholder="Search Order #, Business, Name, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#14231B] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs font-bold text-[#5C6460]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-[#EFEAE0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#5C6460]">Loading B2B wholesale orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Package size={40} className="mx-auto text-[#8E9590]" />
            <p className="text-sm font-bold text-[#14231B]">No wholesale orders found</p>
            <p className="text-xs text-[#5C6460]">
              {searchTerm || statusFilter !== "all"
                ? "Try clearing filters to view all wholesale orders."
                : "Approved B2B wholesale customer orders will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EFEAE0] text-[#5C6460] uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer / Business</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Items / Modes</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {filteredOrders.map((ord) => {
                  const totalUnits = ord.items?.reduce((s, i) => {
                    const snapUnits = (i as any).product_snapshot?.total_units;
                    return s + (snapUnits || i.quantity || 1);
                  }, 0) || 0;

                  const modesSet = new Set(
                    ord.items?.map((i) => (i as any).product_snapshot?.purchase_mode || "unit")
                  );
                  const modesStr = Array.from(modesSet).join(", ").toUpperCase();

                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#183D2B]">
                        {ord.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#14231B]">
                          {(ord.shipping_address as any)?.company_name || "B2B Client"}
                        </div>
                        <div className="text-[11px] text-[#5C6460]">
                          {ord.shipping_address?.full_name || ord.customer_name || "N/A"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div>{ord.customer_email || ord.shipping_address?.email}</div>
                        <div className="text-[#8E9590]">{ord.shipping_address?.phone || "No phone"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#14231B]">
                          {ord.items?.length || 0} product(s) &bull; {totalUnits} pcs total
                        </div>
                        <div className="text-[10px] text-[#8E9590] uppercase font-semibold">
                          Mode: {modesStr || "UNIT"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#183D2B]">
                        {formatPrice(ord.total_amount || ord.subtotal || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          {ord.payment_status || "Pending B2B Invoice"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.order_status.toLowerCase()}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value as any)}
                          className="h-7 px-2 bg-white border border-[#DCCFB9] rounded-xs text-[11px] font-bold text-[#14231B] outline-none cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[#5C6460]">
                        {new Date(ord.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-[#183D2B] hover:bg-[#183D2B]/10 rounded-md transition-colors cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          products={products}
        />
      )}
    </div>
  );
}

export default function AdminWholesaleOrdersPage() {
  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <AdminHeader title="B2B Wholesale Orders" subtitle="Dedicated view for verified B2B wholesale trade orders." />
      <Suspense fallback={<div className="p-8 text-xs text-[#5C6460]">Loading wholesale orders page...</div>}>
        <WholesaleOrdersContent />
      </Suspense>
    </div>
  );
}
