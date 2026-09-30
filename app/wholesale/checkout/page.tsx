"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWholesaleCart } from "@/context/WholesaleCartContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/utils/price";
import {
  Building2,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

export default function WholesaleCheckoutPage() {
  const router = useRouter();
  const { items, itemCount, totalPieces, subtotal, totalPayable, clearCart, isLoading: cartLoading } =
    useWholesaleCart();

  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Dubai");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function checkAuthAndProfile() {
      try {
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setUserRole("unauthenticated");
          setAuthLoading(false);
          return;
        }

        setEmail(user.email || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", user.id)
          .single();

        setUserRole(profile?.role || "customer");
        if (profile?.full_name) setContactPerson(profile.full_name);
        if (profile?.phone) setPhone(profile.phone);

        // Fetch application for company name if available
        const { data: appData } = await supabase
          .from("wholesale_applications")
          .select("business_name, contact_person, phone")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appData) {
          if (appData.business_name) setCompanyName(appData.business_name);
          if (appData.contact_person && !profile?.full_name) setContactPerson(appData.contact_person);
          if (appData.phone && !profile?.phone) setPhone(appData.phone);
        }
      } catch {
        setUserRole("unauthenticated");
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuthAndProfile();
  }, []);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!contactPerson.trim()) {
      setErrorMessage("Contact person name is required.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Phone / WhatsApp contact number is required.");
      return;
    }
    if (!addressLine1.trim()) {
      setErrorMessage("Delivery address is required.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Your wholesale cart is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/wholesale/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          shippingAddress: {
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            country: "AE",
          },
          notes: notes.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            purchaseMode: i.purchaseMode,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to place wholesale order. Please try again.");
        setSubmitting(false);
        return;
      }

      // Success
      await clearCart();
      router.push(`/wholesale/checkout/success?order_number=${encodeURIComponent(data.orderNumber)}&order_id=${data.orderId}`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Network error. Failed to reach order server.");
      setSubmitting(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="bg-[#FAF8F5] min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 size={32} className="animate-spin mx-auto text-[#183D2B]" />
          <p className="text-xs text-[#5C6460]">Preparing wholesale checkout...</p>
        </div>
      </div>
    );
  }

  // Role Guard: Require wholesale_customer
  if (userRole !== "wholesale_customer") {
    return (
      <div className="bg-[#FAF8F5] min-h-[70vh] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl border border-[#EFEAE0] shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-[#C9A84C]/10 text-[#C9A84C] rounded-full flex items-center justify-center mx-auto">
            <Building2 size={32} />
          </div>

          {userRole === "unauthenticated" ? (
            <>
              <h1 className="text-xl font-bold text-[#14231B]">B2B Account Required</h1>
              <p className="text-xs text-[#5C6460] leading-relaxed">
                Wholesale ordering is exclusively available to verified B2B partners. Please log in with your approved wholesale account or submit an application.
              </p>
              <div className="pt-2 space-y-2">
                <Link
                  href="/wholesale/account"
                  className="block w-full py-3 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-sm text-center"
                >
                  Log In to B2B Account
                </Link>
                <Link
                  href="/wholesale/register"
                  className="block w-full py-3 border border-[#183D2B] text-[#183D2B] text-xs font-bold uppercase tracking-wider rounded-sm text-center"
                >
                  Apply for Wholesale Account
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#14231B]">Approval Pending</h1>
              <p className="text-xs text-[#5C6460] leading-relaxed">
                Your wholesale application is currently under review by the Aurelle team. Once approved, you will gain full access to place wholesale orders.
              </p>
              <Link
                href="/wholesale"
                className="inline-flex items-center justify-center gap-1.5 w-full py-3 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-sm text-center"
              >
                Return to Wholesale Portal
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#FAF8F5] min-h-[65vh] py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-xl border border-[#EFEAE0] shadow-xs space-y-4">
          <ShoppingBag size={40} className="mx-auto text-[#8E9590]" />
          <h1 className="text-lg font-bold text-[#14231B]">Your Wholesale Cart is Empty</h1>
          <Link
            href="/wholesale/shop"
            className="inline-flex items-center justify-center w-full py-3 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-sm"
          >
            Explore Wholesale Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#183D2B] text-white px-2 py-0.5 rounded-xs">
              Verified B2B Checkout
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14231B] mt-1">Wholesale Order Confirmation</h1>
          </div>
          <Link href="/wholesale/cart" className="text-xs font-bold text-[#183D2B] hover:underline flex items-center gap-1">
            <ArrowLeft size={14} />
            <span>Return to Cart</span>
          </Link>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3 text-xs text-red-700 font-semibold">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Business Contact & Delivery Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Contact Info */}
            <div className="bg-white p-6 rounded-lg border border-[#EFEAE0] shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#14231B] uppercase tracking-wider border-b border-[#EFEAE0] pb-2.5 flex items-center gap-2">
                <Building2 size={16} className="text-[#183D2B]" />
                <span>1. Business &amp; Contact Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Al Zahra Pharmacy Trading LLC"
                    className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Contact Person Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    WhatsApp / Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Account Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-10 px-3 bg-neutral-100 border border-neutral-200 rounded-md text-xs font-semibold text-[#5C6460] outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white p-6 rounded-lg border border-[#EFEAE0] shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#14231B] uppercase tracking-wider border-b border-[#EFEAE0] pb-2.5 flex items-center gap-2">
                <MapPin size={16} className="text-[#183D2B]" />
                <span>2. Delivery Address</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Street Address / Building / Warehouse <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. Warehouse 14, Ras Al Khor Industrial 2"
                    className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Area / Landmark
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="e.g. Near Dragon Mart"
                      className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      City / Emirate <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
                    >
                      <option value="Dubai">Dubai</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Special Logistics / Order Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Preferred delivery time interval or gate entry pass instructions."
                    className="w-full p-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#14231B] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* B2B Direct Payment Terms Notice */}
            <div className="bg-[#183D2B]/5 p-5 rounded-lg border border-[#183D2B]/20 space-y-2">
              <div className="flex items-center gap-2 text-[#183D2B] font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={18} />
                <span>3. Direct Payment Settlement Terms</span>
              </div>
              <p className="text-xs text-[#5C6460] leading-relaxed">
                Wholesale orders do <strong>NOT</strong> require any online credit card or gateway payment at checkout. Clicking <strong>&quot;Place Wholesale Order&quot;</strong> creates an official wholesale trade order. Aurelle&apos;s B2B distribution team will contact you via WhatsApp / Phone to confirm batch allocation, dispatch timeframe, and direct invoice payment collection.
              </p>
            </div>
          </div>

          {/* Right Column: Wholesale Order Summary & CTA */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-[#EFEAE0] shadow-xs space-y-5 sticky top-24">
              <h2 className="text-sm font-bold text-[#14231B] uppercase tracking-wider border-b border-[#EFEAE0] pb-3">
                Wholesale Items Summary
              </h2>

              {/* Itemized list */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 text-xs border-b border-[#FAF8F5] pb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#14231B] truncate">{item.product.name}</p>
                      <p className="text-[10px] text-[#8E9590]">
                        Mode: {item.purchaseMode.toUpperCase()} ({item.quantity} {item.purchaseMode === "box" ? "box" : "unit"}) &bull; {item.pricing.totalUnits} pcs total
                      </p>
                    </div>
                    <span className="font-bold text-[#183D2B] shrink-0">
                      {formatPrice(item.pricing.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Totals */}
              <div className="space-y-2 text-xs text-[#5C6460] pt-2 border-t border-[#EFEAE0]">
                <div className="flex justify-between">
                  <span>Line Items</span>
                  <span className="font-bold text-[#14231B]">{itemCount} product(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Wholesale Units</span>
                  <span className="font-bold text-[#14231B]">{totalPieces} pcs</span>
                </div>
                <div className="flex justify-between border-t border-[#EFEAE0] pt-2">
                  <span className="font-bold text-[#14231B] uppercase">Order Subtotal</span>
                  <span className="font-bold text-[#183D2B] text-base">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-4 bg-[#183D2B] hover:bg-[#102D20] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Wholesale Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Place Wholesale Order</span>
                  </>
                )}
              </button>

              {/* Trust Pillars */}
              <div className="pt-3 border-t border-[#EFEAE0] text-center space-y-1 text-[11px] text-[#8E9590]">
                <p>Authentic Goods &bull; Direct Dubai Dispatch</p>
                <p>Official TRN Invoice Included</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
