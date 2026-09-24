"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  TrendingUp,
  ShoppingBag,
  Briefcase,
  ArrowRight,
  Search,
  RotateCw,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";

interface OrderItemDetail {
  id: string;
  name: string;
  quantity: number;
  price: number;
  line_total: number;
  image: string | null;
}

interface OrderRecord {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_type: "retail" | "wholesale";
  items_count: number;
  total_amount: number;
  subtotal: number;
  payment_status: "paid" | "pending" | "failed" | string;
  order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | string;
  created_at: string;
  city: string;
  items: OrderItemDetail[];
}

interface WholesaleAppRecord {
  id: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  business_type: string;
  status: string;
  created_at: string;
}

interface DashboardSummary {
  totalRevenue: number;
  retailRevenue: number;
  wholesaleRevenue: number;
  totalOrders: number;
  retailOrdersCount: number;
  wholesaleOrdersCount: number;
  pendingFulfillmentCount: number;
  processingCount: number;
  deliveredCount: number;
  totalProducts: number;
  wholesaleProductsCount: number;
  totalCategories: number;
  totalBrands: number;
  pendingWholesaleApplicationsCount: number;
  totalWholesaleApplicationsCount: number;
}

const DEFAULT_SUMMARY: DashboardSummary = {
  totalRevenue: 0,
  retailRevenue: 0,
  wholesaleRevenue: 0,
  totalOrders: 0,
  retailOrdersCount: 0,
  wholesaleOrdersCount: 0,
  pendingFulfillmentCount: 0,
  processingCount: 0,
  deliveredCount: 0,
  totalProducts: 0,
  wholesaleProductsCount: 0,
  totalCategories: 0,
  totalBrands: 0,
  pendingWholesaleApplicationsCount: 0,
  totalWholesaleApplicationsCount: 0,
};

export default function AdminDashboardPage() {
  const {
    dashboardData,
    dashboardLoading,
    loadDashboard,
    setDashboardData,
  } = useAdminData();

  const [refreshing, setRefreshing] = useState(false);
  const loading = dashboardData === null && dashboardLoading;

  const summary = useMemo(() => dashboardData?.summary ?? DEFAULT_SUMMARY, [dashboardData]);
  const recentOrders = useMemo(() => (dashboardData?.recentOrders ?? []) as OrderRecord[], [dashboardData]);
  const wholesaleApps = useMemo(() => (dashboardData?.wholesaleApps ?? []) as WholesaleAppRecord[], [dashboardData]);

  // Filtering state for Recent Orders
  const [channelTab, setChannelTab] = useState<"all" | "retail" | "wholesale">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  async function loadDashboardData() {
    try {
      setRefreshing(true);
      await loadDashboard(true);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingOrderId(orderId);
    // Optimistic update
    setDashboardData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recentOrders: prev.recentOrders.map((o: any) =>
          o.id === orderId ? { ...o, order_status: newStatus } : o
        ),
      };
    });

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[Dashboard] Failed to update order status:", data.error);
        setFeedback({
          type: "error",
          text: `Status update failed: ${data.error || "Server error"}`,
        });
      } else {
        if (newStatus.toLowerCase() === "delivered") {
          if (data.emailSent) {
            setFeedback({
              type: "success",
              text: `Order status updated to Delivered! Review email sent to customer.`,
            });
          } else if (data.emailError) {
            setFeedback({
              type: "error",
              text: `Order updated, but email failed: ${data.emailError}`,
            });
          } else {
            setFeedback({
              type: "success",
              text: `Order status updated to Delivered.`,
            });
          }
        } else {
          setFeedback({
            type: "success",
            text: `Order status updated to ${newStatus}.`,
          });
        }
      }
    } catch (err) {
      console.error("[Dashboard] Status update error:", err);
      setFeedback({
        type: "error",
        text: "Network error updating order status.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // Filtered orders based on selected Channel tab, status, and search
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      // Channel filter
      if (channelTab === "retail" && order.customer_type !== "retail") return false;
      if (channelTab === "wholesale" && order.customer_type !== "wholesale") return false;

      // Status filter
      if (statusFilter !== "all" && order.order_status !== statusFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNumber = order.order_number?.toLowerCase().includes(query);
        const matchesName = order.customer_name?.toLowerCase().includes(query);
        const matchesEmail = order.customer_email?.toLowerCase().includes(query);
        const matchesCity = order.city?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesName && !matchesEmail && !matchesCity) {
          return false;
        }
      }

      return true;
    });
  }, [recentOrders, channelTab, statusFilter, searchTerm]);

  // Show only 10 latest orders
  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, 10);
  }, [filteredOrders]);

  // Status badges configuration
  const DEFAULT_STATUS_STYLE = {
    label: "Pending",
    icon: <Clock size={11} />,
    badge: "bg-amber-50 text-amber-800 border border-amber-200",
  };

  const STATUS_STYLES: Record<string, typeof DEFAULT_STATUS_STYLE> = {
    pending: DEFAULT_STATUS_STYLE,
    processing: {
      label: "Processing",
      icon: <RotateCw size={11} className="animate-spin" />,
      badge: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    shipped: {
      label: "Shipped",
      icon: <Truck size={11} />,
      badge: "bg-purple-50 text-purple-700 border border-purple-200",
    },
    delivered: {
      label: "Delivered",
      icon: <CheckCircle2 size={11} />,
      badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    cancelled: {
      label: "Cancelled",
      icon: <XCircle size={11} />,
      badge: "bg-red-50 text-red-700 border border-red-200",
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Executive Overview"
        subtitle="Real-time performance, catalog management, and operations for Aurelle Cosmetics Trading FZ-LLC."
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-2xs transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── TOP ACTION & REFRESH BAR ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#DCCFB9]/30">
          <div>
            <h2 className="text-sm font-bold text-[#1D211F] tracking-tight">Commerce & Operations Hub</h2>
            <p className="text-[11px] text-[#5C6460]">Live overview across Retail (B2C) and Wholesale (B2B) channels.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[#183D2B] bg-white hover:bg-[#F7F5EF] border border-[#DCCFB9] rounded-md transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
              title="Refresh live data"
            >
              <RotateCw size={12} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#183D2B] bg-[#183D2B]/10 hover:bg-[#183D2B]/15 rounded-md transition-colors"
            >
              <span>Orders Tab</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── 1. KPI CARDS GRID (REAL DATA ONLY - REDUCED FONT SIZE) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Gross Revenue */}
          <div className="bg-white p-4 rounded-lg border border-[#DCCFB9]/50 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">Gross Revenue</span>
                <div className="w-8 h-8 rounded-md bg-amber-50 text-[#C9A84C] flex items-center justify-center border border-amber-200/60">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-[#1D211F] tracking-tight">
                {loading ? (
                  <div className="h-6 w-24 bg-neutral-100 animate-pulse rounded" />
                ) : (
                  `AED ${summary.totalRevenue.toLocaleString()}`
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#DCCFB9]/30 space-y-0.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#5C6460] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Retail:
                </span>
                <span className="font-semibold text-[#1D211F]">
                  AED {summary.retailRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#5C6460] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Wholesale:
                </span>
                <span className="font-semibold text-[#1D211F]">
                  AED {summary.wholesaleRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders Breakdown */}
          <div className="bg-white p-4 rounded-lg border border-[#DCCFB9]/50 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">Orders</span>
                <div className="w-8 h-8 rounded-md bg-emerald-50 text-[#183D2B] flex items-center justify-center border border-emerald-200/60">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-[#1D211F] tracking-tight">
                {loading ? (
                  <div className="h-6 w-14 bg-neutral-100 animate-pulse rounded" />
                ) : (
                  `${summary.totalOrders}`
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#DCCFB9]/30 space-y-0.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#5C6460]">🛒 Retail:</span>
                <span className="font-bold text-[#183D2B] bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                  {summary.retailOrdersCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#5C6460]">🏢 Wholesale:</span>
                <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
                  {summary.wholesaleOrdersCount}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Fulfillment & Status */}
          <div className="bg-white p-4 rounded-lg border border-[#DCCFB9]/50 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">Fulfillment Status</span>
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
                  <Truck size={16} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-[#1D211F] tracking-tight">
                {loading ? (
                  <div className="h-6 w-20 bg-neutral-100 animate-pulse rounded" />
                ) : (
                  `${summary.pendingFulfillmentCount} Awaiting`
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#DCCFB9]/30 space-y-0.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#5C6460]">Processing:</span>
                <span className="font-semibold text-blue-700">{summary.processingCount}</span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#5C6460]">Delivered:</span>
                <span className="font-semibold text-emerald-700">{summary.deliveredCount}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Wholesale B2B Applications */}
          <div className="bg-white p-4 rounded-lg border border-[#DCCFB9]/50 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">Wholesale B2B</span>
                <div className="w-8 h-8 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/60">
                  <Briefcase size={16} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-[#1D211F] tracking-tight">
                {loading ? (
                  <div className="h-6 w-16 bg-neutral-100 animate-pulse rounded" />
                ) : (
                  `${summary.pendingWholesaleApplicationsCount} Pending`
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#DCCFB9]/30 space-y-0.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#5C6460]">Applications:</span>
                <span className="font-semibold text-[#1D211F]">{summary.totalWholesaleApplicationsCount}</span>
              </div>
              <Link
                href="/admin/wholesale"
                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                <span>Review Licenses</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. DUAL CHANNEL COMPARISON (REMOVED BOTTOM FOOTER STRIP AS REQUESTED) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Retail Channel Summary */}
          <div className="bg-white rounded-lg border border-emerald-900/10 p-4 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-full blur-2xl -z-1 pointer-events-none" />
            <div className="flex items-center justify-between pb-2.5 border-b border-[#DCCFB9]/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShoppingBag size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1D211F]">Retail Channel (B2C)</h3>
                  <p className="text-[10px] text-[#5C6460]">Direct UAE consumer sales & individual deliveries</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Retail
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <div className="bg-[#F7F5EF] p-2.5 rounded-md border border-[#DCCFB9]/40">
                <p className="text-[9.5px] font-semibold text-[#5C6460] uppercase">Retail Volume</p>
                <p className="text-sm font-extrabold text-[#183D2B] mt-0.5">
                  AED {summary.retailRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#F7F5EF] p-2.5 rounded-md border border-[#DCCFB9]/40">
                <p className="text-[9.5px] font-semibold text-[#5C6460] uppercase">Total Orders</p>
                <p className="text-sm font-extrabold text-[#1D211F] mt-0.5">
                  {summary.retailOrdersCount}
                </p>
              </div>
              <div className="bg-[#F7F5EF] p-2.5 rounded-md border border-[#DCCFB9]/40">
                <p className="text-[9.5px] font-semibold text-[#5C6460] uppercase">Avg Value</p>
                <p className="text-sm font-extrabold text-[#1D211F] mt-0.5">
                  AED {summary.retailOrdersCount > 0 ? (summary.retailRevenue / summary.retailOrdersCount).toFixed(1) : "0"}
                </p>
              </div>
            </div>
          </div>

          {/* Wholesale B2B Channel Summary */}
          <div className="bg-white rounded-lg border border-amber-900/15 p-4 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50 rounded-full blur-2xl -z-1 pointer-events-none" />
            <div className="flex items-center justify-between pb-2.5 border-b border-[#DCCFB9]/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Building2 size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1D211F]">Wholesale Channel (B2B)</h3>
                  <p className="text-[10px] text-[#5C6460]">Pharmacies, salons, distributors & bulk trade</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
                Wholesale B2B
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <div className="bg-[#F7F5EF] p-2.5 rounded-md border border-[#DCCFB9]/40">
                <p className="text-[9.5px] font-semibold text-[#5C6460] uppercase">B2B Volume</p>
                <p className="text-sm font-extrabold text-[#C9A84C] mt-0.5">
                  AED {summary.wholesaleRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#F7F5EF] p-2.5 rounded-md border border-[#DCCFB9]/40">
                <p className="text-[9.5px] font-semibold text-[#5C6460] uppercase">Bulk Orders</p>
                <p className="text-sm font-extrabold text-[#1D211F] mt-0.5">
                  {summary.wholesaleOrdersCount}
                </p>
              </div>
              <div className="bg-[#F7F5EF] p-2.5 rounded-md border border-[#DCCFB9]/40">
                <p className="text-[9.5px] font-semibold text-[#5C6460] uppercase">MOQ Products</p>
                <p className="text-sm font-extrabold text-[#1D211F] mt-0.5">
                  {summary.wholesaleProductsCount} items
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. RECENT ORDERS (LATEST 10 ORDERS ONLY + "VIEW ALL" BUTTON) ── */}
        <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs overflow-hidden">
          {/* Header & Filter Controls */}
          <div className="p-4 border-b border-[#DCCFB9]/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#1D211F] tracking-tight flex items-center gap-2">
                  <span>Latest Orders</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F5EF] text-[#5C6460] border border-[#DCCFB9]">
                    Showing {displayedOrders.length} of {filteredOrders.length}
                  </span>
                </h2>
                <p className="text-[11px] text-[#5C6460] mt-0.5">
                  Differentiated tracking for retail individual orders and wholesale B2B purchases.
                </p>
              </div>

              {/* View All Button leading to Orders tab */}
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#183D2B] hover:bg-[#102D20] rounded-md transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                title="Open Orders tab"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Filter Row: Tabs + Status + Search */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-1">
              {/* Channel Tabs: All, Retail, Wholesale */}
              <div className="flex items-center p-0.5 bg-[#F7F5EF] rounded-md border border-[#DCCFB9]/60 self-start">
                <button
                  type="button"
                  onClick={() => setChannelTab("all")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    channelTab === "all"
                      ? "bg-white text-[#1D211F] shadow-2xs"
                      : "text-[#5C6460] hover:text-[#1D211F]"
                  }`}
                >
                  All ({summary.totalOrders})
                </button>
                <button
                  type="button"
                  onClick={() => setChannelTab("retail")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    channelTab === "retail"
                      ? "bg-white text-[#183D2B] shadow-2xs"
                      : "text-[#5C6460] hover:text-[#1D211F]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Retail ({summary.retailOrdersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannelTab("wholesale")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    channelTab === "wholesale"
                      ? "bg-white text-amber-800 shadow-2xs"
                      : "text-[#5C6460] hover:text-[#1D211F]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Wholesale ({summary.wholesaleOrdersCount})</span>
                </button>
              </div>

              {/* Status filter and search */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                {/* Search box */}
                <div className="relative w-full sm:w-56">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C938F]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search order #, customer..."
                    className="w-full h-7 pl-7 pr-2.5 text-[11px] bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-[#1D211F] outline-none focus:bg-white focus:border-[#183D2B] transition-all"
                  />
                </div>

                {/* Status Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto h-7 px-2 text-[11px] font-semibold bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-[#1D211F] outline-none cursor-pointer"
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
          </div>

          {/* Orders Table (Reduced font size) */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#5C6460]">
                <RotateCw size={18} className="animate-spin mx-auto mb-2 text-[#183D2B]" />
                <span>Loading live orders from Supabase...</span>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 rounded-full bg-[#F7F5EF] text-[#8C938F] flex items-center justify-center mx-auto mb-2.5 border border-[#DCCFB9]">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="text-xs font-bold text-[#1D211F]">
                  {channelTab === "wholesale"
                    ? "No Wholesale Orders Found"
                    : channelTab === "retail"
                    ? "No Retail Orders Found"
                    : "No Orders Placed Yet"}
                </h3>
                <p className="text-[11px] text-[#5C6460] mt-1 max-w-sm mx-auto">
                  {channelTab === "wholesale"
                    ? "When verified B2B partners place bulk wholesale orders, they will appear here."
                    : channelTab === "retail"
                    ? "When retail customers place orders on the storefront, they will be listed here."
                    : "All customer purchases and wholesale trade orders will populate here automatically with live data."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCCFB9]/40 bg-[#F7F5EF]/60 text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">
                    <th className="py-2.5 px-3.5">Order # & Type</th>
                    <th className="py-2.5 px-3.5">Customer</th>
                    <th className="py-2.5 px-3.5">Items</th>
                    <th className="py-2.5 px-3.5">Total Amount</th>
                    <th className="py-2.5 px-3.5">Payment</th>
                    <th className="py-2.5 px-3.5">Fulfillment Status</th>
                    <th className="py-2.5 px-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCCFB9]/30 text-[11px]">
                  {displayedOrders.map((order) => {
                    const isWholesale = order.customer_type === "wholesale";
                    const statusConfig = STATUS_STYLES[order.order_status] ?? DEFAULT_STATUS_STYLE;

                    return (
                      <tr key={order.id} className="hover:bg-[#F7F5EF]/40 transition-colors">
                        {/* Order Number & Type Badge */}
                        <td className="py-2.5 px-3.5 align-top">
                          <div className="font-bold text-[#1D211F]">{order.order_number}</div>
                          <div className="mt-0.5">
                            {isWholesale ? (
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
                          </div>
                        </td>

                        {/* Customer Info */}
                        <td className="py-2.5 px-3.5 align-top">
                          <div className="font-semibold text-[#1D211F]">{order.customer_name}</div>
                          <div className="text-[10px] text-[#5C6460] truncate max-w-[170px]">{order.customer_email}</div>
                          <div className="text-[10px] text-[#8C938F]">{order.city}</div>
                        </td>

                        {/* Items */}
                        <td className="py-2.5 px-3.5 align-top">
                          <div className="font-semibold text-[#1D211F]">{order.items_count} item{order.items_count !== 1 ? "s" : ""}</div>
                          {order.items && order.items.length > 0 && (
                            <div className="text-[10px] text-[#5C6460] truncate max-w-[150px]" title={order.items[0]?.name}>
                              {order.items[0]?.name}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </div>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="py-2.5 px-3.5 align-top">
                          <div className="font-extrabold text-[#1D211F]">
                            AED {order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {order.subtotal > 0 && order.subtotal !== order.total_amount && (
                            <div className="text-[9.5px] text-[#8C938F]">
                              Subtotal: AED {order.subtotal.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="py-2.5 px-3.5 align-top">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                              order.payment_status === "paid"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : order.payment_status === "failed"
                                ? "bg-red-50 text-red-800 border border-red-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {order.payment_status}
                          </span>
                        </td>

                        {/* Order Status (Inline selector) */}
                        <td className="py-2.5 px-3.5 align-top">
                          <div className="flex items-center gap-1">
                            <select
                              value={order.order_status}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`h-6 px-1.5 text-[10px] font-bold rounded border outline-none cursor-pointer ${statusConfig.badge}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updatingOrderId === order.id && (
                              <RotateCw size={11} className="animate-spin text-[#183D2B]" />
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-3.5 align-top text-[10px] text-[#5C6460] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString("en-AE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Bottom "View All" Footer Bar */}
            {displayedOrders.length > 0 && (
              <div className="p-3 bg-[#F7F5EF]/60 border-t border-[#DCCFB9]/40 flex items-center justify-between text-xs text-[#5C6460]">
                <span>
                  Showing {displayedOrders.length} of {filteredOrders.length} recent orders
                </span>
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1 font-bold text-[#183D2B] hover:underline cursor-pointer"
                >
                  <span>View All in Orders Tab</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── 4. PENDING WHOLESALE B2B APPLICATIONS (IF ANY) ──────── */}
        {wholesaleApps.length > 0 && (
          <div className="bg-white rounded-lg border border-[#DCCFB9]/60 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1D211F]">B2B Wholesale Trade Applications</h3>
                  <p className="text-[10px] text-[#5C6460]">UAE trade licenses awaiting review and wholesale discount authorization</p>
                </div>
              </div>
              <Link
                href="/admin/wholesale"
                className="text-[11px] font-bold text-[#183D2B] hover:text-[#C9A84C] flex items-center gap-1 transition-colors"
              >
                <span>Wholesale Portal</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {wholesaleApps.map((app) => (
                <div key={app.id} className="p-3 rounded-md border border-[#DCCFB9]/50 bg-[#F7F5EF]/50 hover:bg-[#F7F5EF] transition-colors space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-[11px] text-[#1D211F]">{app.business_name || "Company"}</span>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      app.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : app.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[#5C6460] space-y-0.5">
                    <p>Contact: {app.contact_person}</p>
                    <p className="truncate">{app.email} • {app.phone}</p>
                  </div>
                  <div className="pt-1.5 border-t border-[#DCCFB9]/30 flex items-center justify-between text-[10px]">
                    <span className="text-[#8C938F]">{app.business_type}</span>
                    <Link href="/admin/wholesale" className="font-bold text-[#183D2B] hover:underline">
                      Verify License →
                    </Link>
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
