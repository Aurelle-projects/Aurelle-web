// ============================================================
// AURELLE — ORDER & CART TYPES
// ============================================================

import type { Database, OrderStatus, PaymentStatus, CustomerType } from "./database";
import type { Json } from "./database";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type CartRow = Database["public"]["Tables"]["carts"]["Row"];
export type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];

// ─── Product snapshot stored in order_items ───────────────────────────────────
export interface ProductSnapshot {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand_name: string | null;
  category_name: string | null;
  primary_image_url: string | null;
}

// ─── Cart (client-facing, computed) ──────────────────────────────────────────
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  // Authoritative price from server — never trusted from client
  unit_price: number;
  line_total: number;
  product_name: string;
  product_slug: string;
  product_sku: string;
  product_image_url: string | null;
  stock_status: string;
  max_quantity: number;
  // Wholesale fields (only if user is authorized)
  is_wholesale?: boolean;
  moq?: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  item_count: number;
  customer_type: CustomerType;
}

// ─── Address ─────────────────────────────────────────────────────────────────
export interface ShippingAddress {
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
}

// ─── Order with items ─────────────────────────────────────────────────────────
export interface OrderWithItems extends Order {
  order_items: Array<
    OrderItem & {
      product_snapshot: ProductSnapshot;
    }
  >;
}

// ─── Checkout session input ───────────────────────────────────────────────────
export interface CreateCheckoutInput {
  cart_id: string;
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress | null;
  coupon_code?: string | null;
  notes?: string | null;
}

// ─── Checkout session result ─────────────────────────────────────────────────
export interface CheckoutSessionResult {
  checkout_url: string;
  session_id: string;
  order_id: string;
}

// ─── Address (DB) ─────────────────────────────────────────────────────────────
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];

// ─── Coupon ───────────────────────────────────────────────────────────────────
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

export interface ValidatedCoupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  maximum_discount_amount: number | null;
  calculated_discount: number;
}

// ─── Order status labels (for UI) ────────────────────────────────────────────
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
};

// Ensure Json is used (re-export for convenience)
export type { Json };
