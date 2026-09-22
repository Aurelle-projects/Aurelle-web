"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Lock,
  ArrowLeft,
  MapPin,
  Plus,
  Star,
  Home,
  Briefcase,
  User,
  ShieldCheck,
  Check,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AccountAuthModal from "@/components/auth/AccountAuthModal";

export interface SavedAddress {
  id: string;
  label?: string | null;
  full_name: string;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  is_default: boolean;
}

const UAE_EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

function CheckoutContent() {
  const { items, subtotal, shippingFee, total, clearCart } = useCart();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    emirate: "Dubai",
    area: "",
    streetAddress: "",
    deliveryNotes: "",
    paymentMethod: "cod", // card | cod | apple_pay
    deliverySpeed: "standard", // standard | express
    saveToAccount: true,
    setAsDefault: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const expressFee = formData.deliverySpeed === "express" ? 15 : 0;
  const finalTotal = total + expressFee;

  // Load User & Saved Addresses
  useEffect(() => {
    async function initUserAndAddresses() {
      setLoadingAuth(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUser(user);

        // Pre-fill user profile info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single();

        const defaultName = profile?.full_name || user.user_metadata?.full_name || "";
        const defaultPhone = profile?.phone || user.user_metadata?.phone || "";

        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || defaultName,
          email: user.email || "",
          phone: prev.phone || defaultPhone,
        }));

        // Fetch saved addresses
        try {
          const res = await fetch("/api/addresses");
          const data = await res.json();
          if (res.ok && data.addresses && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            // Default select the default address or first address
            const defaultAddr =
              data.addresses.find((a: SavedAddress) => a.is_default) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setUseNewAddress(false);
            applyAddressToForm(defaultAddr);
          } else {
            setUseNewAddress(true);
            setSelectedAddressId("new");
          }
        } catch (err) {
          console.error("Failed to load saved addresses:", err);
          setUseNewAddress(true);
        }
      } else {
        setUseNewAddress(true);
        setSelectedAddressId("new");
      }
      setLoadingAuth(false);
    }

    initUserAndAddresses();
  }, []);

  function applyAddressToForm(addr: SavedAddress) {
    setFormData((prev) => ({
      ...prev,
      fullName: addr.full_name || prev.fullName,
      phone: addr.phone || prev.phone,
      emirate: addr.city || prev.emirate,
      area: addr.address_line2 || "",
      streetAddress: addr.address_line1 || "",
    }));
  }

  function handleSelectSavedAddress(addr: SavedAddress) {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    applyAddressToForm(addr);
  }

  function handleSelectNewAddress() {
    setSelectedAddressId("new");
    setUseNewAddress(true);
    setFormData((prev) => ({
      ...prev,
      streetAddress: "",
      area: "",
    }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  // Handle Order Placement
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMessage("Your shopping bag is empty.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const shippingAddress = {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      emirate: formData.emirate,
      area: formData.area,
      streetAddress: formData.streetAddress,
      country: "AE",
    };

    try {
      const payload = {
        userId: currentUser?.id || null,
        customerEmail: formData.email,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        shippingAddress,
        items: items.map((item) => ({
          productId: item.product?.id || item.id,
          name: item.product?.name || "Product",
          sku: item.product?.sku || "AUR-ITEM",
          price: item.product?.retail_price || 0,
          quantity: item.quantity,
          image: item.product?.images?.[0]?.url || null,
          slug: item.product?.slug || "",
        })),
        subtotal,
        shippingAmount: shippingFee + expressFee,
        total: finalTotal,
        paymentMethod: formData.paymentMethod,
        notes: formData.deliveryNotes,
        saveAddress: currentUser && useNewAddress && formData.saveToAccount,
        isDefaultAddress: formData.setAsDefault,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place order.");
      }

      setOrderComplete(data.orderNumber);
      clearCart();
    } catch (err) {
      console.error("Order placement exception:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── ORDER SUCCESS SCREEN ─────────────────────────────────
  if (orderComplete) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#EDE9DF] p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Order Confirmed
          </span>

          <h1 className="text-2xl font-serif font-bold text-[#1D211F]">
            Thank You, {formData.fullName.split(" ")[0]}!
          </h1>

          <p className="text-xs text-[#5C6460] leading-relaxed">
            Your elevated essentials order has been placed successfully. A confirmation message and
            order summary have been dispatched to <strong>{formData.email}</strong>.
          </p>

          <div className="p-4 bg-[#F7F5EF] rounded-xl border border-[#EDE9DF] text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Order Reference:</span>
              <span className="font-mono font-bold text-[#183D2B]">{orderComplete}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Delivery Address:</span>
              <span className="font-semibold text-[#1D211F]">
                {formData.streetAddress}, {formData.emirate}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Payment Method:</span>
              <span className="font-semibold text-[#1D211F] uppercase">
                {formData.paymentMethod === "cod" ? "Cash on Delivery" : formData.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#EDE9DF]">
              <span className="text-[#5C6460] font-medium">Total Amount:</span>
              <span className="font-bold text-[#183D2B]">AED {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            {currentUser && (
              <Link
                href="/account?tab=orders"
                className="w-full py-3 bg-[#183D2B] text-white text-xs font-bold rounded-md hover:bg-[#102D20] transition-colors block text-center"
              >
                View Order in Account
              </Link>
            )}
            <Link
              href="/"
              className={`w-full py-3 rounded-md text-xs font-bold transition-colors block text-center ${
                currentUser
                  ? "border border-[#EDE9DF] text-[#1D211F] hover:bg-[#F7F5EF]"
                  : "bg-[#183D2B] text-white hover:bg-[#102D20]"
              }`}
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN CHECKOUT PAGE ───────────────────────────────────
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#EDE9DF] pb-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-[#183D2B]" />
            <h1 className="text-2xl font-serif font-bold text-[#1D211F]">UAE Secure Checkout</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6460] hover:text-[#183D2B] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Bag</span>
          </Link>
        </div>

        {/* Guest sign in reminder */}
        {!currentUser && !loadingAuth && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EDE9DF] shadow-xs">
            <div className="flex items-center gap-2.5">
              <User size={18} className="text-[#183D2B] shrink-0" />
              <p className="text-xs text-[#5C6460]">
                Already have an Aurelle account? Sign in for 1-click checkout with your saved
                addresses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-1.5 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left 2 Columns: Shipping & Payment ─────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. DELIVERY ADDRESS SELECTION */}
            <div className="bg-white p-6 rounded-2xl border border-[#EDE9DF] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDE9DF]/80 pb-3">
                <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#183D2B] text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Delivery Address
                </h2>
                {currentUser && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectNewAddress}
                    className="text-xs font-semibold text-[#183D2B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    Add New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses Radio Cards */}
              {currentUser && savedAddresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id && !useNewAddress;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                              : "border-[#EDE9DF] bg-[#F7F5EF]/40 hover:border-[#183D2B]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#F7F5EF] text-[#183D2B]">
                                {addr.label?.toLowerCase() === "office" ? (
                                  <Briefcase size={10} />
                                ) : (
                                  <Home size={10} />
                                )}
                                {addr.label || "Address"}
                              </span>
                              {addr.is_default && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#183D2B] text-white uppercase">
                                  <Star size={8} className="fill-white" /> Default
                                </span>
                              )}
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-[#183D2B] bg-[#183D2B] text-white"
                                  : "border-[#8C938F]"
                              }`}
                            >
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                          </div>

                          <p className="text-xs font-bold text-[#1D211F]">{addr.full_name}</p>
                          <p className="text-[11px] text-[#5C6460] mt-0.5 line-clamp-2">
                            {addr.address_line1}
                            {addr.address_line2 && `, ${addr.address_line2}`}, {addr.city}
                          </p>
                          {addr.phone && (
                            <p className="text-[11px] text-[#8C938F] mt-1 font-mono">{addr.phone}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {useNewAddress && (
                    <div className="pt-2 text-xs font-semibold text-[#183D2B]">
                      Entering a new delivery address below:
                    </div>
                  )}
                </div>
              )}

              {/* Address Form (Used if guest, no saved addresses, or adding new) */}
              {(useNewAddress || savedAddresses.length === 0 || !currentUser) && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="Recipient full name"
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#EDE9DF] rounded-md text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Phone Number (UAE Mobile) *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+971 50 123 4567"
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#EDE9DF] rounded-md text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="For order tracking & receipt"
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#EDE9DF] rounded-md text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Emirate / City *
                      </label>
                      <select
                        name="emirate"
                        value={formData.emirate}
                        onChange={handleChange}
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#EDE9DF] rounded-md text-xs font-semibold text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white cursor-pointer"
                      >
                        {UAE_EMIRATES.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Area / District (Optional)
                      </label>
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        placeholder="e.g. Downtown / Marina / Jumeirah"
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#EDE9DF] rounded-md text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                        Street Address / Villa / Apartment Number *
                      </label>
                      <input
                        type="text"
                        name="streetAddress"
                        value={formData.streetAddress}
                        onChange={handleChange}
                        required
                        placeholder="Building name, street, apartment/villa number"
                        className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#EDE9DF] rounded-md text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Save to account checkbox for logged in user */}
                  {currentUser && (
                    <div className="pt-2 space-y-1.5 border-t border-[#EDE9DF]/60">
                      <label className="flex items-center gap-2 text-xs text-[#1D211F] cursor-pointer">
                        <input
                          type="checkbox"
                          name="saveToAccount"
                          checked={formData.saveToAccount}
                          onChange={handleChange}
                          className="rounded border-[#EDE9DF] text-[#183D2B] focus:ring-[#183D2B]"
                        />
                        <span>Save this address to my account for future orders</span>
                      </label>
                      {formData.saveToAccount && (
                        <label className="flex items-center gap-2 text-xs text-[#5C6460] pl-6 cursor-pointer">
                          <input
                            type="checkbox"
                            name="setAsDefault"
                            checked={formData.setAsDefault}
                            onChange={handleChange}
                            className="rounded border-[#EDE9DF] text-[#183D2B] focus:ring-[#183D2B]"
                          />
                          <span>Set as my default delivery address</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. DELIVERY SPEED */}
            <div className="bg-white p-6 rounded-2xl border border-[#EDE9DF] shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider flex items-center gap-2 border-b border-[#EDE9DF]/80 pb-3">
                <span className="w-5 h-5 rounded-full bg-[#183D2B] text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                Delivery Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    formData.deliverySpeed === "standard"
                      ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                      : "border-[#EDE9DF] bg-[#F7F5EF]/40 hover:border-[#183D2B]/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliverySpeed"
                      value="standard"
                      checked={formData.deliverySpeed === "standard"}
                      onChange={handleChange}
                      className="text-[#183D2B] focus:ring-[#183D2B]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#1D211F]">Standard UAE Delivery</p>
                      <p className="text-[11px] text-[#5C6460]">2 – 3 Business Days</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">FREE</span>
                </label>

                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    formData.deliverySpeed === "express"
                      ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                      : "border-[#EDE9DF] bg-[#F7F5EF]/40 hover:border-[#183D2B]/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliverySpeed"
                      value="express"
                      checked={formData.deliverySpeed === "express"}
                      onChange={handleChange}
                      className="text-[#183D2B] focus:ring-[#183D2B]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#1D211F]">Express Same-Day</p>
                      <p className="text-[11px] text-[#5C6460]">Orders before 1 PM</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1D211F]">+ AED 15</span>
                </label>
              </div>
            </div>

            {/* 3. PAYMENT METHOD */}
            <div className="bg-white p-6 rounded-2xl border border-[#EDE9DF] shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider flex items-center gap-2 border-b border-[#EDE9DF]/80 pb-3">
                <span className="w-5 h-5 rounded-full bg-[#183D2B] text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                Payment Options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    formData.paymentMethod === "cod"
                      ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                      : "border-[#EDE9DF] bg-[#F7F5EF]/40 hover:border-[#183D2B]/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Banknote size={20} className="text-[#183D2B]" />
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleChange}
                      className="text-[#183D2B] focus:ring-[#183D2B]"
                    />
                  </div>
                  <p className="text-xs font-bold text-[#1D211F]">Cash on Delivery</p>
                  <p className="text-[10px] text-[#5C6460]">Pay when package arrives</p>
                </label>

                <label
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    formData.paymentMethod === "card"
                      ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                      : "border-[#EDE9DF] bg-[#F7F5EF]/40 hover:border-[#183D2B]/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard size={20} className="text-[#183D2B]" />
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={handleChange}
                      className="text-[#183D2B] focus:ring-[#183D2B]"
                    />
                  </div>
                  <p className="text-xs font-bold text-[#1D211F]">Credit / Debit Card</p>
                  <p className="text-[10px] text-[#5C6460]">Visa, Mastercard, Amex</p>
                </label>

                <label
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    formData.paymentMethod === "apple_pay"
                      ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                      : "border-[#EDE9DF] bg-[#F7F5EF]/40 hover:border-[#183D2B]/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs">Pay</span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="apple_pay"
                      checked={formData.paymentMethod === "apple_pay"}
                      onChange={handleChange}
                      className="text-[#183D2B] focus:ring-[#183D2B]"
                    />
                  </div>
                  <p className="text-xs font-bold text-[#1D211F]">Apple Pay</p>
                  <p className="text-[10px] text-[#5C6460]">Touch ID / Face ID</p>
                </label>
              </div>
            </div>
          </div>

          {/* ── Right Column: Order Summary ───────────────────── */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#EDE9DF] shadow-xs space-y-4 sticky top-24">
              <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#EDE9DF] pb-3">
                Order Summary ({items.length} {items.length === 1 ? "Item" : "Items"})
              </h2>

              {/* Items breakdown list */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => {
                  const productImg = item.product?.images?.[0]?.url;
                  const itemPrice = item.product?.retail_price || 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-md bg-[#F7F5EF] flex items-center justify-center text-[10px] font-bold text-[#183D2B] shrink-0 overflow-hidden">
                          {productImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={productImg}
                              alt={item.product?.name || "Product"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (item.product?.name || "A").charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1D211F] truncate">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-[10px] text-[#8C938F]">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-[#1D211F] shrink-0">
                        AED {(itemPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Cost Calculations */}
              <div className="pt-3 border-t border-[#EDE9DF] space-y-2 text-xs text-[#5C6460]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#1D211F]">AED {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-[#1D211F]">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `AED ${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {expressFee > 0 && (
                  <div className="flex justify-between text-[#183D2B]">
                    <span>Express Delivery</span>
                    <span className="font-bold">+ AED {expressFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#EDE9DF] text-sm font-bold text-[#1D211F]">
                  <span>Total Amount</span>
                  <span className="text-[#183D2B]">AED {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={14} />
                {isSubmitting ? "Placing Order..." : `Place Order • AED ${finalTotal.toFixed(2)}`}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C938F] pt-1">
                <ShieldCheck size={12} className="text-emerald-700" />
                <span>Encrypted 256-bit SSL Secure Checkout</span>
              </div>
            </div>
          </div>
        </form>

        <AccountAuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode="login"
        />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
