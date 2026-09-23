"use client";

import React, { useEffect, useRef } from "react";
import {
  X,
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Truck,
  Building2,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { AdminOrderItem, AdminOrderItemDetail, ProductRow } from "@/context/AdminDataContext";

interface OrderDetailsModalProps {
  order: AdminOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: AdminOrderItem["order_status"]) => void;
  products?: ProductRow[] | null;
}

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  shipped: "bg-blue-50 text-blue-800 border border-blue-200",
  processing: "bg-amber-50 text-amber-800 border border-amber-200",
  pending: "bg-neutral-100 text-neutral-700 border border-neutral-200",
  cancelled: "bg-red-50 text-red-800 border border-red-200",
};

export default function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onStatusChange,
  products,
}: OrderDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const addr = order.shipping_address || {};
  const isWholesale = order.customer_type === "wholesale";

  function getItemImage(item: AdminOrderItemDetail): string | null {
    if (item.image) return item.image;
    if (item.product_id && products) {
      const match = products.find((p) => p.id === item.product_id);
      if (match?.image_url) return match.image_url;
    }
    return null;
  }

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl border border-[#DCCFB9] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#DCCFB9]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-sm text-[#183D2B]">
              {order.order_number}
            </span>
            {isWholesale ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                <Building2 size={10} />
                <span>Wholesale</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShoppingBag size={10} />
                <span>Retail</span>
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[#5C6460]">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5C6460] hover:text-[#1D211F] rounded-md hover:bg-[#EDE9DF] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#1D211F]">
          {/* Status & Fulfillment Control Bar */}
          <div className="bg-[#F7F5EF] p-3 rounded-lg border border-[#DCCFB9]/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#5C6460] uppercase tracking-wider block mb-0.5">
                  Payment Status
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider ${
                    order.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.payment_status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#5C6460] uppercase tracking-wider block mb-0.5">
                  Fulfillment
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold capitalize ${
                    STATUS_COLORS[order.order_status] || "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {order.order_status}
                </span>
              </div>
            </div>

            {onStatusChange && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#5C6460]">Update Status:</span>
                <select
                  value={order.order_status}
                  onChange={(e) =>
                    onStatusChange(order.id, e.target.value as AdminOrderItem["order_status"])
                  }
                  className="h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#1D211F] outline-none cursor-pointer hover:border-[#183D2B] transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* Location & Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#DCCFB9]/60 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#183D2B] uppercase tracking-wider">
                <User size={13} />
                <span>Customer Details</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-[#1D211F]">{order.customer_name}</p>
                <div className="flex items-center gap-1.5 text-[#5C6460]">
                  <Mail size={12} className="shrink-0" />
                  <span className="break-all">{order.customer_email || "No email provided"}</span>
                </div>
                {addr.phone && (
                  <div className="flex items-center gap-1.5 text-[#5C6460]">
                    <Phone size={12} className="shrink-0" />
                    <span>{addr.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Location */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#DCCFB9]/60 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#183D2B] uppercase tracking-wider">
                <MapPin size={13} />
                <span>Delivery Location</span>
              </div>
              <div className="text-xs space-y-0.5 text-[#1D211F]">
                {(addr.streetAddress || addr.addressLine1 || addr.address_line1) && (
                  <p className="font-medium">
                    {addr.streetAddress || addr.addressLine1 || addr.address_line1}
                  </p>
                )}
                {(addr.area || addr.addressLine2 || addr.address_line2) && (
                  <p className="text-[#5C6460]">
                    {addr.area || addr.addressLine2 || addr.address_line2}
                  </p>
                )}
                <p className="font-semibold text-[#183D2B]">
                  {order.city}
                  {addr.emirate && addr.emirate !== order.city ? `, ${addr.emirate}` : ""}, UAE
                </p>
                {addr.postalCode && (
                  <p className="text-[11px] text-[#5C6460]">Postal: {addr.postalCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#183D2B] uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} />
                <span>Order Items ({order.items?.length || 0})</span>
              </h4>
              <span className="text-[11px] text-[#5C6460]">
                Total Units:{" "}
                <strong className="text-[#1D211F]">{order.items_count}</strong>
              </span>
            </div>

            <div className="border border-[#DCCFB9]/60 rounded-lg overflow-hidden divide-y divide-[#DCCFB9]/40 bg-white">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => {
                  const image = getItemImage(item);
                  return (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={item.name}
                            className="w-12 h-12 rounded-md object-cover border border-[#DCCFB9]/60 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                            <Package size={20} strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[#1D211F] truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5C6460]">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs text-[#183D2B]">
                          AED {item.line_total.toFixed(2)}
                        </p>
                        {item.quantity > 1 && item.price && (
                          <p className="text-[10px] text-[#5C6460]">
                            AED {item.price.toFixed(2)} each
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[#5C6460]">
                  No item details recorded for this order.
                </div>
              )}
            </div>
          </div>

          {/* Order Financial Breakdown */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#DCCFB9]/60 space-y-1.5">
            <div className="flex justify-between text-xs text-[#5C6460]">
              <span>Subtotal:</span>
              <span className="font-medium text-[#1D211F]">
                AED {(order.subtotal ?? order.total_amount).toFixed(2)}
              </span>
            </div>
            {order.discount_amount ? (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Discount:</span>
                <span>- AED {order.discount_amount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-xs text-[#5C6460]">
              <span>Shipping:</span>
              <span className="font-medium text-[#1D211F]">
                {order.shipping_amount && order.shipping_amount > 0
                  ? `AED ${order.shipping_amount.toFixed(2)}`
                  : "Free UAE Delivery"}
              </span>
            </div>
            <div className="pt-2 border-t border-[#DCCFB9]/50 flex justify-between text-sm font-bold text-[#183D2B]">
              <span>Total Amount:</span>
              <span>AED {order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-[#F7F5EF] p-3 rounded-lg border border-[#DCCFB9]/60 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5C6460] uppercase tracking-wider">
                <FileText size={12} />
                <span>Customer Notes</span>
              </div>
              <p className="text-xs text-[#1D211F] italic">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#DCCFB9]/60 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#183D2B] text-white rounded-md text-xs font-semibold hover:bg-[#183D2B]/90 transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
