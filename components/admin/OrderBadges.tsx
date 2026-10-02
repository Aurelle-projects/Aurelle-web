"use client";

import React from "react";
import { Check, X, Clock, Package, Truck, AlertCircle, RefreshCw } from "lucide-react";

export interface FulfillmentBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function FulfillmentStatusBadge({
  status,
  className = "",
  size = "md",
}: FulfillmentBadgeProps) {
  const norm = String(status || "").trim().toLowerCase();
  const isSm = size === "sm";

  const paddingClass = isSm ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10px]";
  const iconSize = isSm ? 10 : 11;

  if (norm === "delivered") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs ${paddingClass} ${className}`}
      >
        <Check size={iconSize} strokeWidth={2.5} className="shrink-0 text-emerald-700" />
        <span>DELIVERED</span>
      </span>
    );
  }

  if (norm === "cancelled") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shadow-2xs ${paddingClass} ${className}`}
      >
        <X size={iconSize} strokeWidth={2.5} className="shrink-0 text-red-600" />
        <span>CANCELLED</span>
      </span>
    );
  }

  if (norm === "shipped") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs ${paddingClass} ${className}`}
      >
        <Truck size={iconSize} strokeWidth={2} className="shrink-0 text-blue-700" />
        <span>SHIPPED</span>
      </span>
    );
  }

  if (norm === "out_for_delivery" || norm === "out for delivery") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs ${paddingClass} ${className}`}
      >
        <Truck size={iconSize} strokeWidth={2} className="shrink-0 text-purple-700" />
        <span>OUT FOR DELIVERY</span>
      </span>
    );
  }

  if (norm === "processing") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs ${paddingClass} ${className}`}
      >
        <Package size={iconSize} strokeWidth={2} className="shrink-0 text-sky-700" />
        <span>PROCESSING</span>
      </span>
    );
  }

  // Pending / default
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs ${paddingClass} ${className}`}
    >
      <Clock size={iconSize} strokeWidth={2} className="shrink-0 text-amber-700" />
      <span>PENDING</span>
    </span>
  );
}

export interface PaymentBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
  label?: string;
}

export function PaymentStatusBadge({
  status,
  className = "",
  size = "md",
  label,
}: PaymentBadgeProps) {
  const norm = String(status || "").trim().toLowerCase();
  const isSm = size === "sm";

  const paddingClass = isSm ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10px]";
  const iconSize = isSm ? 10 : 11;

  if (norm === "paid") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs ${paddingClass} ${className}`}
      >
        <Check size={iconSize} strokeWidth={2.5} className="shrink-0 text-emerald-700" />
        <span>{label || "PAID"}</span>
      </span>
    );
  }

  if (norm === "failed") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shadow-2xs ${paddingClass} ${className}`}
      >
        <AlertCircle size={iconSize} strokeWidth={2} className="shrink-0 text-red-600" />
        <span>{label || "FAILED"}</span>
      </span>
    );
  }

  if (norm === "refunded") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-300 shadow-2xs ${paddingClass} ${className}`}
      >
        <RefreshCw size={iconSize} strokeWidth={2} className="shrink-0 text-neutral-600" />
        <span>{label || "REFUNDED"}</span>
      </span>
    );
  }

  // Pending / default
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs ${paddingClass} ${className}`}
    >
      <Clock size={iconSize} strokeWidth={2} className="shrink-0 text-amber-700" />
      <span>{label || "PENDING"}</span>
    </span>
  );
}
