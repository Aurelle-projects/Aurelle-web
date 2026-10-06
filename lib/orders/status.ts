export interface OrderStatusContext {
  id?: string;
  order_number?: string | null;
  customer_type?: string | null;
  status?: string | null;
  payment_status?: string | null;
  shipping_address?: Record<string, unknown> | null;
  notes?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
}

/**
 * Determines whether an order is a Cash on Delivery (COD) or Direct Settlement / Manual B2B order.
 * 
 * Rules:
 * - Online / Stripe prepaid orders (having a stripe_checkout_session_id or stripe_payment_intent_id) are NOT COD.
 * - Wholesale B2B orders use direct manual payment terms upon delivery/order settlement -> COD / Direct payment.
 * - Retail orders marked with 'Normal Payment (COD)' or without online payment IDs -> COD.
 */
export function isCodOrDirectPaymentOrder(order: OrderStatusContext): boolean {
  if (!order) return false;

  // If order is bound to an online Stripe Checkout session or PaymentIntent, it is a prepaid card order
  if (order.stripe_checkout_session_id || order.stripe_payment_intent_id) {
    return false;
  }

  const customerType = (order.customer_type || "").trim().toLowerCase();
  const orderNumber = (order.order_number || "").trim().toUpperCase();

  // B2B Wholesale orders intentionally use manual direct payment settlement
  if (customerType === "wholesale" || orderNumber.startsWith("AUR-WS")) {
    return true;
  }

  // Check shipping_address JSON payload
  const shippingAddr = (order.shipping_address as Record<string, unknown>) || {};
  const paymentMethodInAddr = String(
    shippingAddr.payment_method ||
      shippingAddr.paymentMethod ||
      shippingAddr.payment_terms ||
      shippingAddr.paymentTerms ||
      ""
  ).toLowerCase();

  if (
    paymentMethodInAddr.includes("cod") ||
    paymentMethodInAddr.includes("cash") ||
    paymentMethodInAddr.includes("normal payment") ||
    paymentMethodInAddr.includes("direct") ||
    paymentMethodInAddr.includes("b2b") ||
    paymentMethodInAddr.includes("invoice")
  ) {
    return true;
  }

  // Check notes string
  const notes = String(order.notes || "").toLowerCase();
  if (
    notes.includes("cod") ||
    notes.includes("cash on delivery") ||
    notes.includes("normal payment (cod)") ||
    notes.includes("wholesale") ||
    notes.includes("direct settlement") ||
    notes.includes("payment to be settled directly")
  ) {
    return true;
  }

  // Default retail fallback if no Stripe session/intent exists
  if (customerType === "retail" || !customerType) {
    return true;
  }

  return false;
}

export interface StatusTransitionResult {
  newFulfillmentStatus: string;
  newPaymentStatus: string;
  paymentStatusUpdated: boolean;
  reason?: string;
}

/**
 * Pure evaluation function for fulfillment and payment status transitions.
 * 
 * When admin marks fulfillment status as 'delivered':
 * - If current payment_status is 'pending' AND payment method is COD / Direct collection:
 *     payment_status transitions automatically to 'paid'.
 * - If order is already paid or prepaid online:
 *     payment_status remains unchanged ('paid').
 * - For non-delivered statuses (cancelled, shipped, processing, pending):
 *     payment_status remains unchanged unless already altered.
 */
export function calculateOrderStatusTransition(
  order: OrderStatusContext,
  targetStatus: string
): StatusTransitionResult {
  const normalizedTargetStatus = String(targetStatus || "").trim().toLowerCase();
  const currentPaymentStatus = String(order.payment_status || "pending").trim().toLowerCase();

  const isBecomingDelivered = normalizedTargetStatus === "delivered";
  const isCodOrDirect = isCodOrDirectPaymentOrder(order);

  if (isBecomingDelivered && currentPaymentStatus === "pending" && isCodOrDirect) {
    return {
      newFulfillmentStatus: "delivered",
      newPaymentStatus: "paid",
      paymentStatusUpdated: true,
      reason: "COD/Direct-payment order automatically marked as paid upon delivery.",
    };
  }

  return {
    newFulfillmentStatus: normalizedTargetStatus,
    newPaymentStatus: order.payment_status || "pending",
    paymentStatusUpdated: false,
  };
}
