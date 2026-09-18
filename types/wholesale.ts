// ============================================================
// AURELLE — WHOLESALE TYPES
// ============================================================

import type {
  Database,
  WholesaleApplicationStatus,
  UserRole,
} from "./database";

export type WholesaleApplication =
  Database["public"]["Tables"]["wholesale_applications"]["Row"];

export type WholesaleApplicationInsert =
  Database["public"]["Tables"]["wholesale_applications"]["Insert"];

// ─── Wholesale application form data ────────────────────────────────────────
export interface WholesaleApplicationFormData {
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  business_type: WholesaleBusinessType;
  expected_order_volume: string;
  notes: string;
  // trade_license uploaded separately via secure upload
}

export type WholesaleBusinessType =
  | "retailer"
  | "distributor"
  | "salon_spa"
  | "pharmacy"
  | "supermarket"
  | "online_retailer"
  | "other";

export const WHOLESALE_BUSINESS_TYPE_LABELS: Record<
  WholesaleBusinessType,
  string
> = {
  retailer: "Retailer / Shop",
  distributor: "Distributor",
  salon_spa: "Salon / Spa",
  pharmacy: "Pharmacy / Medical",
  supermarket: "Supermarket / Hypermarket",
  online_retailer: "Online Retailer",
  other: "Other",
};

export const WHOLESALE_APPLICATION_STATUS_LABELS: Record<
  WholesaleApplicationStatus,
  string
> = {
  pending: "Pending Review",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

// ─── Wholesale user info (server-side) ──────────────────────────────────────
export interface WholesaleUserInfo {
  is_wholesale: boolean;
  is_approved: boolean;
  role: UserRole;
  application_status: WholesaleApplicationStatus | null;
}

// ─── Admin wholesale review input ───────────────────────────────────────────
export interface WholesaleReviewInput {
  application_id: string;
  action: "approve" | "reject";
  rejection_reason?: string;
}
