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
  is_out_of_stock?: boolean;
  image_url?: string;
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
  is_wholesale?: boolean;
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
  is_wholesale?: boolean;
  created_at?: string;
}

export interface AdminComboComponent {
  product_id?: string;
  name: string;
  sku?: string;
  quantity: number;
  image?: string | null;
  retail_price?: number;
}

export interface AdminOrderItemDetail {
  id: string;
  product_id?: string | null;
  combo_id?: string | null;
  is_combo?: boolean;
  name: string;
  image?: string | null;
  quantity: number;
  line_total: number;
  price?: number;
  sku?: string;
  slug?: string;
  original_price?: number;
  compare_at_price?: number | null;
  savings_amount?: number;
  savings_percentage?: number;
  components?: AdminComboComponent[];
  product_snapshot?: any;
}

export interface AdminOrderShippingAddress {
  fullName?: string;
  full_name?: string;
  phone?: string;
  streetAddress?: string;
  addressLine1?: string;
  address_line1?: string;
  addressLine2?: string;
  address_line2?: string;
  area?: string;
  city?: string;
  emirate?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  postal_code?: string;
  email?: string;
}

export interface AdminOrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_type: "retail" | "wholesale";
  items_count: number;
  total_amount: number;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  shipping_amount?: number;
  payment_status: "paid" | "pending" | "failed" | string;
  order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | string;
  created_at: string;
  city: string;
  shipping_address?: AdminOrderShippingAddress | null;
  notes?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  items?: AdminOrderItemDetail[];
  // Computed combo summary helpers
  has_combo?: boolean;
  is_pure_combo?: boolean;
  is_mixed?: boolean;
  combo_items_count?: number;
  regular_items_count?: number;
  total_savings?: number;
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
          id, name, slug, sku, retail_price, wholesale_price, status, is_out_of_stock,
          category:categories(name),
          product_images(secure_url, is_primary)
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
            is_out_of_stock: p.is_out_of_stock ?? false,
            image_url: primaryImg,
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
          const addr = (o.shipping_address as AdminOrderShippingAddress) || {};
          const customer_name =
            addr.fullName ||
            addr.full_name ||
            (o.customer_email ? o.customer_email.split("@")[0] : "Customer");
          const city = addr.city || addr.emirate || addr.area || "UAE";

          const rawItems = Array.isArray(o.order_items) ? o.order_items : [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: AdminOrderItemDetail[] = rawItems.map((it: any) => {
            const snap = it.product_snapshot || {};
            const isCombo = Boolean(
              it.combo_id ||
              snap.is_combo ||
              snap.combo_id ||
              (snap.components && Array.isArray(snap.components) && snap.components.length > 0)
            );
            const comboId = it.combo_id || snap.combo_id || null;
            const components: AdminComboComponent[] = Array.isArray(snap.components) ? snap.components : [];

            const unitPrice =
              Number(it.price_snapshot) ||
              (Number(it.line_total) / (it.quantity || 1)) ||
              0;

            // Calculate authoritative original combined value of included components if combo
            let originalPrice = Number(snap.original_price) || Number(snap.compare_at_price) || 0;
            if (!originalPrice && isCombo && components.length > 0) {
              originalPrice = components.reduce(
                (sum, c) => sum + (Number(c.retail_price) || 0) * (c.quantity || 1),
                0
              );
            }

            let savingsAmount = Number(snap.savings_amount) || 0;
            if (!savingsAmount && isCombo && originalPrice > unitPrice) {
              savingsAmount = Math.max(0, originalPrice - unitPrice);
            }

            let savingsPct = Number(snap.savings_percentage) || 0;
            if (!savingsPct && isCombo && originalPrice > 0 && savingsAmount > 0) {
              savingsPct = Math.round((savingsAmount / originalPrice) * 100);
            }

            return {
              id: it.id,
              product_id: it.product_id || null,
              combo_id: comboId,
              is_combo: isCombo,
              name: snap.name || (isCombo ? "Combo Offer" : "Product"),
              image: snap.image || snap.image_url || snap.imageUrl || snap.primary_image_url || null,
              quantity: it.quantity || 1,
              line_total: Number(it.line_total) || 0,
              price: unitPrice,
              sku: it.sku_snapshot || snap.sku || "",
              slug: snap.slug || "",
              original_price: originalPrice > 0 ? originalPrice : undefined,
              compare_at_price: snap.compare_at_price ? Number(snap.compare_at_price) : undefined,
              savings_amount: savingsAmount > 0 ? savingsAmount : undefined,
              savings_percentage: savingsPct > 0 ? savingsPct : undefined,
              components,
              product_snapshot: snap,
            };
          });

          const hasCombo = items.some((it) => it.is_combo);
          const comboItemsCount = items
            .filter((it) => it.is_combo)
            .reduce((sum, it) => sum + it.quantity, 0);
          const regularItemsCount = items
            .filter((it) => !it.is_combo)
            .reduce((sum, it) => sum + it.quantity, 0);
          const isPureCombo = hasCombo && regularItemsCount === 0;
          const isMixed = hasCombo && regularItemsCount > 0;
          const totalSavings =
            items.reduce(
              (sum, it) => sum + (it.savings_amount ? it.savings_amount * it.quantity : 0),
              0
            ) + (Number(o.discount_amount) || 0);

          return {
            id: o.id,
            order_number: o.order_number || "",
            customer_name,
            customer_email: o.customer_email || "",
            customer_type: (o.customer_type === "wholesale" ? "wholesale" : "retail") as "retail" | "wholesale",
            items_count: items.reduce((sum, item) => sum + item.quantity, 0) || rawItems.length || 1,
            total_amount: Number(o.total) || 0,
            subtotal: Number(o.subtotal) || Number(o.total) || 0,
            discount_amount: Number(o.discount_amount) || 0,
            tax_amount: Number(o.tax_amount) || 0,
            shipping_amount: Number(o.shipping_amount) || 0,
            payment_status: o.payment_status || "pending",
            order_status: (o.status || "pending") as AdminOrderItem["order_status"],
            created_at: o.created_at || new Date().toISOString(),
            city,
            shipping_address: addr,
            notes: o.notes || null,
            stripe_checkout_session_id: o.stripe_checkout_session_id || null,
            stripe_payment_intent_id: o.stripe_payment_intent_id || null,
            items,
            has_combo: hasCombo,
            is_pure_combo: isPureCombo,
            is_mixed: isMixed,
            combo_items_count: comboItemsCount,
            regular_items_count: regularItemsCount,
            total_savings: totalSavings > 0 ? totalSavings : undefined,
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
