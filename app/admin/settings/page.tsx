"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  Save,
  Check,
  Truck,
  Building2,
  Mail,
  Phone,
  Clock,
  Share2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface StoreSettingsState {
  standard_shipping_fee: number | string;
  free_shipping_threshold: number | string;
  vat_rate: number | string;
  store_name: string;
  trade_license: string;
  city: string;
  country: string;
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  trade_email: string;
  operating_hours: string;
  operating_hours_weekend: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  social_whatsapp: string;
}

const DEFAULT_SETTINGS: StoreSettingsState = {
  standard_shipping_fee: 20,
  free_shipping_threshold: 199,
  vat_rate: 5,
  store_name: "Aurelle Cosmetics Trading FZ-LLC",
  trade_license: "FZ-LLC-2026-AURELLE",
  city: "Dubai",
  country: "United Arab Emirates",
  contact_address: "Business Center, Meydan Free Zone\nDubai, United Arab Emirates",
  contact_phone: "+971 50 123 4567",
  contact_email: "care@aurelle.ae",
  trade_email: "trade@aurelle.ae",
  operating_hours: "Monday – Saturday: 9:00 AM – 6:00 PM GST",
  operating_hours_weekend: "Sunday: Closed (Online Orders Processed 24/7)",
  social_instagram: "https://instagram.com/aurelle.ae",
  social_facebook: "https://facebook.com/aurelle.ae",
  social_tiktok: "https://tiktok.com/@aurelle.ae",
  social_whatsapp: "https://wa.me/971501234567",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch live settings on mount from API
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        if (!res.ok) {
          throw new Error("Failed to load store settings from server.");
        }
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
      } catch (err: any) {
        console.error("Error loading settings:", err);
        setErrorMessage(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        ...settings,
        standard_shipping_fee: Number(settings.standard_shipping_fee) || 0,
        free_shipping_threshold: Number(settings.free_shipping_threshold) || 0,
        vat_rate: Number(settings.vat_rate) || 0,
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to update configuration.");
      }

      setSuccessMessage("Store settings and shipping fees updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage(err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      <AdminHeader
        title="Store Settings & Configuration"
        subtitle="Manage live shipping charges, headquarters address, phone numbers, and operational parameters."
      />

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5">
        {/* Alerts */}
        {successMessage && (
          <div className="p-3.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-lg border bg-rose-50 border-rose-200 text-rose-900 flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-[#EDE9DF] flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#183D2B]" />
            <p className="text-xs font-semibold text-[#5C6460]">
              Loading current configuration from database…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* ── 1. SHIPPING & FISCAL PARAMETERS ────────────────────────── */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-[#EDE9DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#EDE9DF] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                  <Truck size={17} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                    Shipping & Delivery Fees (No Hardcode)
                  </h2>
                  <p className="text-[11px] text-[#5C6460]">
                    Controls customer bag shipping fee, free shipping progress bar, and checkout total.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#EDE9DF]">
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Standard Shipping Charge (AED) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      name="standard_shipping_fee"
                      value={settings.standard_shipping_fee}
                      onChange={handleChange}
                      required
                      placeholder="20"
                      className="w-full h-9 px-3 pr-12 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#183D2B] outline-none focus:ring-1 focus:ring-[#183D2B]"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-[#8C938F]">
                      AED
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5C6460] mt-1.5 leading-tight">
                    Applied automatically to UAE deliveries below free shipping threshold.
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#EDE9DF]">
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Free Shipping Threshold (AED) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      name="free_shipping_threshold"
                      value={settings.free_shipping_threshold}
                      onChange={handleChange}
                      required
                      placeholder="199"
                      className="w-full h-9 px-3 pr-12 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#183D2B] outline-none focus:ring-1 focus:ring-[#183D2B]"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-[#8C938F]">
                      AED
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5C6460] mt-1.5 leading-tight">
                    Cart orders equal or above this amount receive free delivery (0 AED).
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#EDE9DF]">
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    UAE VAT Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      name="vat_rate"
                      value={settings.vat_rate}
                      onChange={handleChange}
                      required
                      placeholder="5"
                      className="w-full h-9 px-3 pr-8 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#1D211F] outline-none focus:ring-1 focus:ring-[#183D2B]"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-[#8C938F]">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5C6460] mt-1.5 leading-tight">
                    Standard Federal Tax Authority VAT percentage (currently 5%).
                  </p>
                </div>
              </div>
            </div>

            {/* ── 2. HEADQUARTERS ADDRESS & COMPANY INFO ────────────────── */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-[#EDE9DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#EDE9DF] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                  <Building2 size={17} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                    Company Entity & Headquarters Address
                  </h2>
                  <p className="text-[11px] text-[#5C6460]">
                    Displayed on Contact Us page, Storefront Footer, and order receipts.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Legal Company Name *
                  </label>
                  <input
                    type="text"
                    name="store_name"
                    value={settings.store_name}
                    onChange={handleChange}
                    required
                    placeholder="Aurelle Cosmetics Trading FZ-LLC"
                    className="w-full h-9 px-3.5 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none focus:bg-white focus:ring-1 focus:ring-[#183D2B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Headquarters Physical Address *
                  </label>
                  <textarea
                    rows={3}
                    name="contact_address"
                    value={settings.contact_address}
                    onChange={handleChange}
                    required
                    placeholder="Business Center, Meydan Free Zone&#10;Dubai, United Arab Emirates"
                    className="w-full p-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none focus:bg-white focus:ring-1 focus:ring-[#183D2B]"
                  />
                  <p className="text-[10px] text-[#5C6460] mt-1">
                    Tip: You can use new lines to format multiple address lines cleanly on the Contact page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Emirate / City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={settings.city}
                      onChange={handleChange}
                      placeholder="Dubai"
                      className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={settings.country}
                      onChange={handleChange}
                      placeholder="United Arab Emirates"
                      className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      UAE Trade License
                    </label>
                    <input
                      type="text"
                      name="trade_license"
                      value={settings.trade_license}
                      onChange={handleChange}
                      placeholder="FZ-LLC-2026-AURELLE"
                      className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. CONTACT CHANNELS & EMAILS ──────────────────────────── */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-[#EDE9DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#EDE9DF] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                  <Phone size={17} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                    Contact Channels, Phone &amp; Emails
                  </h2>
                  <p className="text-[11px] text-[#5C6460]">
                    Appears directly in Storefront Footer and Contact Us Page cards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Contact Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    name="contact_phone"
                    value={settings.contact_phone}
                    onChange={handleChange}
                    required
                    placeholder="+971 50 123 4567"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none focus:bg-white focus:ring-1 focus:ring-[#183D2B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Customer Care Email *
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={settings.contact_email}
                    onChange={handleChange}
                    required
                    placeholder="care@aurelle.ae"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none focus:bg-white focus:ring-1 focus:ring-[#183D2B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Trade &amp; Wholesale Email
                  </label>
                  <input
                    type="email"
                    name="trade_email"
                    value={settings.trade_email}
                    onChange={handleChange}
                    placeholder="trade@aurelle.ae"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none focus:bg-white focus:ring-1 focus:ring-[#183D2B]"
                  />
                </div>
              </div>
            </div>

            {/* ── 4. OPERATING HOURS ────────────────────────────────────── */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-[#EDE9DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#EDE9DF] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                  <Clock size={17} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                    Operating Hours
                  </h2>
                  <p className="text-[11px] text-[#5C6460]">
                    Displayed on the Contact Us page &amp; customer inquiry cards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Working Hours (Weekdays)
                  </label>
                  <input
                    type="text"
                    name="operating_hours"
                    value={settings.operating_hours}
                    onChange={handleChange}
                    placeholder="Monday – Saturday: 9:00 AM – 6:00 PM GST"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none focus:bg-white focus:ring-1 focus:ring-[#183D2B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Weekend / Online Orders Note
                  </label>
                  <input
                    type="text"
                    name="operating_hours_weekend"
                    value={settings.operating_hours_weekend}
                    onChange={handleChange}
                    placeholder="Sunday: Closed (Online Orders Processed 24/7)"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none focus:bg-white focus:ring-1 focus:ring-[#183D2B]"
                  />
                </div>
              </div>
            </div>

            {/* ── 5. SOCIAL MEDIA & MESSAGING LINKS ─────────────────────── */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-[#EDE9DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#EDE9DF] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                  <Share2 size={17} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                    Social Media &amp; Messaging Handles
                  </h2>
                  <p className="text-[11px] text-[#5C6460]">
                    Direct links attached to Footer icons and WhatsApp customer chat.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    WhatsApp Link / Number
                  </label>
                  <input
                    type="text"
                    name="social_whatsapp"
                    value={settings.social_whatsapp}
                    onChange={handleChange}
                    placeholder="https://wa.me/971501234567"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Instagram Profile URL
                  </label>
                  <input
                    type="text"
                    name="social_instagram"
                    value={settings.social_instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/aurelle.ae"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    TikTok Profile URL
                  </label>
                  <input
                    type="text"
                    name="social_tiktok"
                    value={settings.social_tiktok}
                    onChange={handleChange}
                    placeholder="https://tiktok.com/@aurelle.ae"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Facebook Profile URL
                  </label>
                  <input
                    type="text"
                    name="social_facebook"
                    value={settings.social_facebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/aurelle.ae"
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 bg-white/95 backdrop-blur-md rounded-xl border border-[#DCCFB9] shadow-lg">
              <div className="flex items-center gap-2 text-xs text-[#5C6460]">
                <Sparkles size={14} className="text-[#183D2B]" />
                <span>Changes will take effect instantly across the storefront, cart, and checkout.</span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
