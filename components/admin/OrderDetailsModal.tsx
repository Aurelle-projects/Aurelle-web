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
import { FulfillmentStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderBadges";

interface OrderDetailsModalProps {
  order: AdminOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: AdminOrderItem["order_status"]) => void;
  products?: ProductRow[] | null;
}

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
                <span className="text-[10px] font-bold text-[#5C6460] uppercase tracking-wider block mb-1">
                  Payment Status
                </span>
                <PaymentStatusBadge status={order.payment_status} size="md" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#5C6460] uppercase tracking-wider block mb-1">
                  Fulfillment Status
                </span>
                <FulfillmentStatusBadge status={order.order_status} size="md" />
              </div>
            </div>

            {onStatusChange && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#5C6460]">Update Status:</span>
                <select
                  value={order.order_status.toLowerCase()}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#183D2B] uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} />
                <span>Order Items ({order.items?.length || 0})</span>
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-[#5C6460]">
                {order.has_combo && (
                  <span className="bg-[#102D20] text-[#E8DCC4] px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border border-[#DCCFB9]/40">
                    Combo Included
                  </span>
                )}
                <span>
                  Total Units: <strong className="text-[#1D211F]">{order.items_count}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  const image = getItemImage(item);
                  const isCombo = Boolean(item.is_combo);
                  const components = item.components || [];

                  if (isCombo) {
                    return (
                      <div
                        key={item.id || `combo-${idx}`}
                        className="rounded-xl border-2 border-[#183D2B]/20 bg-gradient-to-b from-[#FAF8F5] to-white shadow-2xs overflow-hidden"
                      >
                        {/* Combo Header Strip */}
                        <div className="px-4 py-2.5 bg-[#102D20] text-white flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-widest bg-[#D4AF37] text-[#102D20]">
                              COMBO OFFER
                            </span>
                            <span className="font-bold text-xs text-[#FAF8F5]">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[#DCCFB9]">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            <span>
                              Bundle Qty: <strong className="text-white">{item.quantity}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Combo Body & Pricing Analysis */}
                        <div className="p-4 space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#DCCFB9]/50">
                            <div className="flex items-center gap-3">
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={image}
                                  alt={item.name}
                                  className="w-14 h-14 rounded-lg object-cover border border-[#DCCFB9] shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-[#F7F5EF] border border-[#DCCFB9] flex items-center justify-center text-[#8E9590] shrink-0">
                                  <Package size={22} strokeWidth={1.5} />
                                </div>
                              )}
                              <div>
                                <h5 className="font-bold text-xs text-[#1D211F]">{item.name}</h5>
                                <p className="text-[11px] text-[#5C6460]">
                                  Contains {components.length} curated product{components.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            {/* Authoritative Historical Pricing Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto bg-[#F7F5EF] p-2.5 rounded-lg border border-[#DCCFB9]/60 text-center">
                              <div className="px-2">
                                <span className="text-[9.5px] font-bold text-[#5C6460] uppercase block">
                                  Combo Price
                                </span>
                                <span className="text-xs font-bold text-[#183D2B]">
                                  AED {(item.price ?? 0).toFixed(2)}
                                </span>
                              </div>

                              {item.original_price ? (
                                <div className="px-2 border-l border-[#DCCFB9]/50">
                                  <span className="text-[9.5px] font-bold text-[#5C6460] uppercase block">
                                    Original Value
                                  </span>
                                  <span className="text-xs font-semibold text-[#8E9590] line-through">
                                    AED {item.original_price.toFixed(2)}
                                  </span>
                                </div>
                              ) : null}

                              {item.savings_amount ? (
                                <div className="px-2 border-l border-[#DCCFB9]/50">
                                  <span className="text-[9.5px] font-bold text-emerald-800 uppercase block">
                                    You Save
                                  </span>
                                  <span className="text-xs font-bold text-emerald-700">
                                    AED {item.savings_amount.toFixed(2)}
                                  </span>
                                </div>
                              ) : null}

                              {item.savings_percentage ? (
                                <div className="px-2 border-l border-[#DCCFB9]/50">
                                  <span className="text-[9.5px] font-bold text-[#D4AF37] uppercase block">
                                    Discount
                                  </span>
                                  <span className="text-xs font-extrabold text-[#996515]">
                                    {item.savings_percentage}% OFF
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* Components Contents Breakdown */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#183D2B] uppercase tracking-wider">
                              <span>Included Products in this Combo ({components.length})</span>
                              <span className="text-[10px] text-[#5C6460] normal-case">
                                Total Units for Fulfillment
                              </span>
                            </div>

                            {components.length > 0 ? (
                              <div className="divide-y divide-[#DCCFB9]/30 border border-[#DCCFB9]/60 rounded-lg overflow-hidden bg-white">
                                {components.map((comp, cIdx) => {
                                  const totalCompUnits = (comp.quantity || 1) * item.quantity;
                                  return (
                                    <div
                                      key={cIdx}
                                      className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF8F5]/60 transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {comp.image ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={comp.image}
                                            alt={comp.name}
                                            className="w-9 h-9 rounded object-cover border border-[#DCCFB9]/60 shrink-0"
                                          />
                                        ) : (
                                          <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DCCFB9]/60 flex items-center justify-center text-[#8E9590] shrink-0">
                                            <Package size={14} />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <p className="font-semibold text-xs text-[#1D211F] truncate">
                                            {comp.quantity > 1 ? `${comp.quantity} × ` : ""}{comp.name}
                                          </p>
                                          <div className="flex items-center gap-2 text-[10.5px] text-[#5C6460]">
                                            {comp.sku && <span>SKU: {comp.sku}</span>}
                                            {comp.retail_price ? (
                                              <span>Standard: AED {comp.retail_price.toFixed(2)}</span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#183D2B]/10 text-[#183D2B]">
                                          {totalCompUnits} {totalCompUnits === 1 ? "unit" : "units"} to pack
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-[#5C6460] italic">
                                Component details not listed.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Combo Line Total Strip */}
                        <div className="px-4 py-2 bg-[#F7F5EF] border-t border-[#DCCFB9]/50 flex items-center justify-between text-xs">
                          <span className="text-[#5C6460]">
                            Line Total ({item.quantity} combo{item.quantity !== 1 ? "s" : ""} × AED {(item.price ?? 0).toFixed(2)})
                          </span>
                          <span className="font-bold text-xs text-[#183D2B]">
                            AED {item.line_total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Normal Product Row
                  return (
                    <div
                      key={item.id || `product-${idx}`}
                      className="p-3 border border-[#DCCFB9]/60 rounded-lg bg-white flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors"
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
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5C6460] flex-wrap">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            <span>
                              Ordered Qty: <strong>{item.quantity}</strong>
                            </span>
                            {(item.product_snapshot as any)?.purchase_mode && (
                              <span className="bg-[#183D2B]/10 text-[#183D2B] px-1.5 py-0.5 rounded-xs font-bold uppercase text-[9px]">
                                Mode: {(item.product_snapshot as any).purchase_mode}
                                {(item.product_snapshot as any).total_units
                                  ? ` (${(item.product_snapshot as any).total_units} pcs)`
                                  : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs text-[#183D2B]">
                          AED {item.line_total.toFixed(2)}
                        </p>
                        {item.price && (
                          <p className="text-[10px] text-[#5C6460]">
                            AED {item.price.toFixed(2)} / unit
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[#5C6460] border border-[#DCCFB9]/60 rounded-lg">
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
                <span>Discount / Promo:</span>
                <span>- AED {order.discount_amount.toFixed(2)}</span>
              </div>
            ) : null}
            {order.total_savings && order.total_savings > 0 ? (
              <div className="flex justify-between text-xs text-[#996515] bg-[#FAF3E0] px-2 py-1 rounded">
                <span className="font-semibold">Total Customer Savings:</span>
                <span className="font-bold">AED {order.total_savings.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-xs text-[#5C6460]">
              <span>Tax (5% VAT):</span>
              <span className="font-medium text-[#1D211F]">
                AED {(order.tax_amount ?? 0).toFixed(2)}
              </span>
            </div>
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
