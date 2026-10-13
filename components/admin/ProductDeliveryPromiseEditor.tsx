"use client";

import React from "react";
import { Truck, Eye } from "lucide-react";

export interface DeliveryPromiseSettings {
  enabled: boolean;
  badge: string;
  dispatch: string;
  note: string;
  shipping_policy?: string;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliveryPromiseSettings = {
  enabled: true,
  badge: "UAE Express Delivery",
  dispatch: "Dispatches in 24h",
  note: "Delivering across Dubai, Abu Dhabi, Sharjah & all 7 Emirates. Free shipping on orders ≥ 199 AED.",
  shipping_policy: "",
};

interface ProductDeliveryPromiseEditorProps {
  settings: DeliveryPromiseSettings;
  onChange: (settings: DeliveryPromiseSettings) => void;
}

export default function ProductDeliveryPromiseEditor({
  settings,
  onChange,
}: ProductDeliveryPromiseEditorProps) {
  function handleToggle(enabled: boolean) {
    onChange({ ...settings, enabled });
  }

  function handleFieldChange(field: "badge" | "dispatch" | "note" | "shipping_policy", value: string) {
    onChange({ ...settings, [field]: value });
  }

  const effectiveBadge = settings.badge.trim() || DEFAULT_DELIVERY_SETTINGS.badge;
  const effectiveDispatch = settings.dispatch.trim() || DEFAULT_DELIVERY_SETTINGS.dispatch;
  const effectiveNote = settings.note.trim() || DEFAULT_DELIVERY_SETTINGS.note;

  return (
    <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#DCCFB9]/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
            <Truck size={17} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider">
              Delivery &amp; Dispatch Promise Box
            </h2>
            <p className="text-[11px] text-[#5C6460]">
              The green trust card &amp; shipping information displayed on this product&apos;s page.
            </p>
          </div>
        </div>

        {/* Enabled Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs font-bold text-[#1D211F]">
            {settings.enabled ? "Enabled" : "Disabled"}
          </span>
          <div
            onClick={() => handleToggle(!settings.enabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              settings.enabled ? "bg-[#183D2B]" : "bg-[#DCCFB9]"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </label>
      </div>

      {settings.enabled ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Badge Title */}
            <div>
              <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                Badge Title
              </label>
              <input
                type="text"
                value={settings.badge}
                onChange={(e) => handleFieldChange("badge", e.target.value)}
                placeholder="UAE Express Delivery"
                className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-bold text-[#183D2B] outline-none focus:bg-white focus:border-[#183D2B]"
              />
              <p className="text-[10px] text-[#8E9590] mt-1">
                e.g. &ldquo;UAE Express Delivery&rdquo;, &ldquo;Dubai Express&rdquo;, &ldquo;Authentic Import&rdquo;
              </p>
            </div>

            {/* Dispatch Tag */}
            <div>
              <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                Dispatch Time Tag
              </label>
              <input
                type="text"
                value={settings.dispatch}
                onChange={(e) => handleFieldChange("dispatch", e.target.value)}
                placeholder="Dispatches in 24h"
                className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-emerald-800 outline-none focus:bg-white focus:border-[#183D2B]"
              />
              <p className="text-[10px] text-[#8E9590] mt-1">
                e.g. &ldquo;Dispatches in 24h&rdquo;, &ldquo;Same-Day Dispatch&rdquo;, &ldquo;In Stock in UAE&rdquo;
              </p>
            </div>
          </div>

          {/* Delivery Note / Details */}
          <div>
            <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
              Delivery Description / Note (Green Card)
            </label>
            <textarea
              rows={2}
              value={settings.note}
              onChange={(e) => handleFieldChange("note", e.target.value)}
              placeholder="Delivering across Dubai, Abu Dhabi, Sharjah & all 7 Emirates. Free shipping on orders ≥ 199 AED."
              className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none resize-none focus:bg-white focus:border-[#183D2B]"
            />
            <p className="text-[10px] text-[#8E9590] mt-1">
              Coverage notice, shipping timeline, and free delivery threshold on the product card.
            </p>
          </div>

          {/* Custom Shipping & Returns Policy Bullets */}
          <div>
            <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
              Custom Shipping &amp; Returns Bullets (Optional)
            </label>
            <textarea
              rows={3}
              value={settings.shipping_policy || ""}
              onChange={(e) => handleFieldChange("shipping_policy", e.target.value)}
              placeholder="Leave blank for standard UAE delivery terms, or enter custom points (e.g. 'Express Delivery: 24h across UAE', 'Easy Returns: 14-day policy')..."
              className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none resize-none focus:bg-white focus:border-[#183D2B]"
            />
            <p className="text-[10px] text-[#8E9590] mt-1">
              Overrides the default points under &ldquo;Shipping &amp; Returns&rdquo; in the product overview. Use &ldquo;Title: Details&rdquo; format to bold the title.
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5C6460] mb-2">
              <Eye size={13} className="text-[#183D2B]" />
              <span>Live Storefront Preview (How buyers see it)</span>
            </div>
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#183D2B] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={17} />
              </div>
              <div className="text-xs space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#183D2B] uppercase tracking-wide text-[11px] bg-[#183D2B]/10 px-2 py-0.5 rounded-xs">
                    {effectiveBadge}
                  </span>
                  <span className="text-emerald-800 font-semibold text-[11px]">
                    {effectiveDispatch}
                  </span>
                </div>
                <p className="text-[#5C6460] text-[11px] leading-normal">
                  {effectiveNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#FAF8F5] border border-[#EDE9DF] rounded-lg text-xs text-[#5C6460] flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-neutral-400" />
          <span>The Delivery Promise box is hidden for this product on the storefront.</span>
        </div>
      )}
    </div>
  );
}
