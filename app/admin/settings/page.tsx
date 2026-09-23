"use client";

import React, { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Save, Check } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: "Aurelle Cosmetics Trading FZ-LLC",
    currency: "AED",
    vatRate: "5",
    freeShippingThreshold: "199",
    supportEmail: "care@aurelle.ae",
    supportPhone: "+971 4 000 0000",
    tradeLicense: "FZ-LLC-2026-AURELLE",
    city: "Dubai",
    country: "United Arab Emirates",
  });

  const [isSaved, setIsSaved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  }

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Store Settings & Configuration"
        subtitle="Manage UAE commerce regulations, VAT rates, currency, and store identity."
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        {isSaved && (
          <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-900 flex items-center gap-2.5 text-xs font-medium">
            <Check size={16} />
            <span>Store settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Identity */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
              Commercial Entity Identity
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    UAE Trade License Number
                  </label>
                  <input
                    type="text"
                    name="tradeLicense"
                    value={settings.tradeLicense}
                    onChange={handleChange}
                    className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Emirate / Jurisdiction
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={settings.city}
                    onChange={handleChange}
                    className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Tax */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
              Fiscal & Shipping Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Primary Currency
                </label>
                <input
                  type="text"
                  name="currency"
                  value={settings.currency}
                  disabled
                  className="w-full h-8 px-3 bg-neutral-100 border border-[#DCCFB9] rounded-md text-xs font-bold text-[#1D211F] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  UAE VAT Rate (%)
                </label>
                <input
                  type="number"
                  name="vatRate"
                  value={settings.vatRate}
                  onChange={handleChange}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Free Shipping Threshold (AED)
                </label>
                <input
                  type="number"
                  name="freeShippingThreshold"
                  value={settings.freeShippingThreshold}
                  onChange={handleChange}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs font-bold text-[#183D2B] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
              Customer Support Channels
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Official Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  value={settings.supportEmail}
                  onChange={handleChange}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  UAE Telephone Number
                </label>
                <input
                  type="text"
                  name="supportPhone"
                  value={settings.supportPhone}
                  onChange={handleChange}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              <Save size={14} />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
