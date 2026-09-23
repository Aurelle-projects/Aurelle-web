"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  slug: string;
  retail_price: number;
  wholesale_price: number | null;
  category_name: string;
  status: string;
  image_url?: string;
  stock_quantity: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  sort_order: number;
  is_active: boolean;
  subcategories_count?: number;
}

export interface AdminSubcategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string;
  sort_order: number;
  is_active: boolean;
  parent_name?: string;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  logo_public_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface AdminOrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_type: "retail" | "wholesale";
  items_count: number;
  total_amount: number;
  payment_status: "paid" | "pending" | "failed" | string;
  order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | string;
  created_at: string;
  city: string;
}

export interface AdminReviewItem {
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

export interface DashboardSummary {
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

export interface AdminDashboardData {
  summary: DashboardSummary;
  recentOrders: any[];
  wholesaleApps: any[];
}

interface AdminDataContextType {
  // Products
  products: ProductRow[] | null;
  productsLoading: boolean;
  loadProducts: (force?: boolean) => Promise<void>;
  setProducts: React.Dispatch<React.SetStateAction<ProductRow[] | null>>;

  // Categories & Subcategories
  categories: AdminCategory[] | null;
  subcategories: AdminSubcategory[] | null;
  categoriesLoading: boolean;
  loadCategories: (force?: boolean) => Promise<void>;
  setCategories: React.Dispatch<React.SetStateAction<AdminCategory[] | null>>;
  setSubcategories: React.Dispatch<React.SetStateAction<AdminSubcategory[] | null>>;

  // Brands
  brands: AdminBrand[] | null;
  brandsLoading: boolean;
  loadBrands: (force?: boolean) => Promise<void>;
  setBrands: React.Dispatch<React.SetStateAction<AdminBrand[] | null>>;

  // Orders
  orders: AdminOrderItem[] | null;
  ordersLoading: boolean;
  pendingOrdersCount: number;
  loadOrders: (force?: boolean) => Promise<void>;
  setOrders: React.Dispatch<React.SetStateAction<AdminOrderItem[] | null>>;

  // Reviews
  reviews: AdminReviewItem[] | null;
  reviewsLoading: boolean;
  loadReviews: (force?: boolean) => Promise<void>;
  setReviews: React.Dispatch<React.SetStateAction<AdminReviewItem[] | null>>;

  // Dashboard
  dashboardData: AdminDashboardData | null;
  dashboardLoading: boolean;
  loadDashboard: (force?: boolean) => Promise<void>;
  setDashboardData: React.Dispatch<React.SetStateAction<AdminDashboardData | null>>;
}

const AdminDataContext = createContext<AdminDataContextType | null>(null);

const STALE_TIME_MS = 60_000; // 1 minute cache lifetime before silent background revalidation

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  // State
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const productsFetchedAt = useRef<number>(0);

  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[] | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const categoriesFetchedAt = useRef<number>(0);

  const [brands, setBrands] = useState<AdminBrand[] | null>(null);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const brandsFetchedAt = useRef<number>(0);

  const [orders, setOrders] = useState<AdminOrderItem[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const ordersFetchedAt = useRef<number>(0);

  const [reviews, setReviews] = useState<AdminReviewItem[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const reviewsFetchedAt = useRef<number>(0);

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const dashboardFetchedAt = useRef<number>(0);

  // ── Load Products ────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (force = false) => {
    const isStale = Date.now() - productsFetchedAt.current > STALE_TIME_MS;
    if (!force && products !== null && !isStale) {
      return;
    }

    if (products === null) {
      setProductsLoading(true);
    }

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("products")
        .select(`
          id, name, slug, sku, retail_price, wholesale_price, status,
          category:categories(name),
          product_images(secure_url, is_primary),
          inventory(stock_quantity)
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: ProductRow[] = data.map((p: any) => {
          const primaryImg =
            p.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.secure_url ||
            p.product_images?.[0]?.secure_url;
          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            slug: p.slug,
            retail_price: p.retail_price,
            wholesale_price: p.wholesale_price,
            category_name: p.category?.name || "Unassigned",
            status: p.status || "published",
            image_url: primaryImg,
            stock_quantity: p.inventory?.[0]?.stock_quantity ?? 10,
          };
        });
        setProducts(mapped);
      } else {
        setProducts([]);
      }
      productsFetchedAt.current = Date.now();
    } catch (err) {
      console.error("[AdminContext] Error loading products:", err);
      if (products === null) setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [products]);

  // ── Load Categories & Subcategories ───────────────────────────────────────
  const loadCategories = useCallback(async (force = false) => {
    const isStale = Date.now() - categoriesFetchedAt.current > STALE_TIME_MS;
    if (!force && categories !== null && subcategories !== null && !isStale) {
      return;
    }

    if (categories === null) {
      setCategoriesLoading(true);
    }

    try {
      const res = await fetch("/api/admin/categories");
      const result = await res.json();
      if (res.ok && !result.error) {
        const cats: AdminCategory[] = result.categories ?? [];
        const subs: AdminSubcategory[] = result.subcategories ?? [];

        const catMap = new Map(cats.map((c) => [c.id, c.name]));
        const mappedSubs: AdminSubcategory[] = subs.map((s) => ({
          ...s,
          parent_name: catMap.get(s.parent_id) || "Unknown Category",
        }));

        const mappedCats: AdminCategory[] = cats.map((cat) => ({
          ...cat,
          subcategories_count: subs.filter((s) => s.parent_id === cat.id).length,
        }));

        setCategories(mappedCats);
        setSubcategories(mappedSubs);
        categoriesFetchedAt.current = Date.now();
      }
    } catch (err) {
      console.error("[AdminContext] Error loading categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, [categories, subcategories]);

  // ── Load Brands ───────────────────────────────────────────────────────────
  const loadBrands = useCallback(async (force = false) => {
    const isStale = Date.now() - brandsFetchedAt.current > STALE_TIME_MS;
    if (!force && brands !== null && !isStale) {
      return;
    }

    if (brands === null) {
      setBrandsLoading(true);
    }

    try {
      const res = await fetch("/api/admin/brands");
      const result = await res.json();
      if (res.ok && result.brands) {
        setBrands(result.brands);
        brandsFetchedAt.current = Date.now();
      }
    } catch (err) {
      console.error("[AdminContext] Error loading brands:", err);
    } finally {
      setBrandsLoading(false);
    }
  }, [brands]);

  // ── Load Orders ───────────────────────────────────────────────────────────
  const loadOrders = useCallback(async (force = false) => {
    const isStale = Date.now() - ordersFetchedAt.current > STALE_TIME_MS;
    if (!force && orders !== null && !isStale) {
      return;
    }

    if (orders === null) {
      setOrdersLoading(true);
    }

    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: AdminOrderItem[] = json.orders.map((o: any) => {
          const addr = (o.shipping_address as Record<string, unknown>) || {};
          const customer_name =
            (addr.fullName as string) ||
            (addr.full_name as string) ||
            (o.customer_email ? o.customer_email.split("@")[0] : "Customer");
          const city = (addr.city as string) || (addr.emirate as string) || "UAE";
          return {
            id: o.id,
            order_number: o.order_number || "",
            customer_name,
            customer_email: o.customer_email || "",
            customer_type: (o.customer_type === "wholesale" ? "wholesale" : "retail") as "retail" | "wholesale",
            items_count: Array.isArray(o.order_items) ? o.order_items.length : 1,
            total_amount: Number(o.total) || 0,
            payment_status: o.payment_status || "pending",
            order_status: (o.status || "pending") as AdminOrderItem["order_status"],
            created_at: o.created_at || new Date().toISOString(),
            city,
          };
        });

        setOrders(mapped);
        const pending = mapped.filter((o) => o.order_status === "pending" || o.order_status === "processing").length;
        setPendingOrdersCount(pending);
        ordersFetchedAt.current = Date.now();
      }
    } catch (err) {
      console.error("[AdminContext] Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [orders]);

  // ── Load Reviews ──────────────────────────────────────────────────────────
  const loadReviews = useCallback(async (force = false) => {
    const isStale = Date.now() - reviewsFetchedAt.current > STALE_TIME_MS;
    if (!force && reviews !== null && !isStale) {
      return;
    }

    if (reviews === null) {
      setReviewsLoading(true);
    }

    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (res.ok && data.reviews) {
        setReviews(data.reviews);
        reviewsFetchedAt.current = Date.now();
      } else if (reviews === null) {
        setReviews([]);
      }
    } catch (err) {
      console.error("[AdminContext] Error loading reviews:", err);
      if (reviews === null) setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [reviews]);

  // ── Load Dashboard ────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (force = false) => {
    const isStale = Date.now() - dashboardFetchedAt.current > STALE_TIME_MS;
    if (!force && dashboardData !== null && !isStale) {
      return;
    }

    if (dashboardData === null) {
      setDashboardLoading(true);
    }

    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (data.success && data.summary) {
        setDashboardData({
          summary: data.summary,
          recentOrders: data.recentOrders || [],
          wholesaleApps: data.recentWholesaleApplications || [],
        });
        dashboardFetchedAt.current = Date.now();
      }
    } catch (err) {
      console.error("[AdminContext] Error loading dashboard:", err);
    } finally {
      setDashboardLoading(false);
    }
  }, [dashboardData]);

  // Periodic background check for pending orders count (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  return (
    <AdminDataContext.Provider
      value={{
        products,
        productsLoading,
        loadProducts,
        setProducts,

        categories,
        subcategories,
        categoriesLoading,
        loadCategories,
        setCategories,
        setSubcategories,

        brands,
        brandsLoading,
        loadBrands,
        setBrands,

        orders,
        ordersLoading,
        pendingOrdersCount,
        loadOrders,
        setOrders,

        reviews,
        reviewsLoading,
        loadReviews,
        setReviews,

        dashboardData,
        dashboardLoading,
        loadDashboard,
        setDashboardData,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
}
