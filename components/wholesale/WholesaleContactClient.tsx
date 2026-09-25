"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Package,
  Layers,
  ChevronDown,
} from "lucide-react";

export interface ContactCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ContactProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  category_id?: string;
  wholesale_moq?: number;
}

interface WholesaleContactClientProps {
  categories: ContactCategory[];
  products: ContactProduct[];
}

export default function WholesaleContactClient({
  categories,
  products,
}: WholesaleContactClientProps) {
  // Form State
  const [contactPerson, setContactPerson] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic products filtered by the chosen category
  const availableProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter((p) => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const selectedProductObj = products.find((p) => p.id === selectedProduct);
  const currentMoq = selectedProductObj?.wholesale_moq || 0;

  const parsedQuantity = parseInt(quantity, 10);
  const isBelowMoq = Boolean(
    selectedProductObj &&
      currentMoq > 0 &&
      quantity.trim() !== "" &&
      !isNaN(parsedQuantity) &&
      parsedQuantity < currentMoq
  );

  function handleCategoryChange(catId: string) {
    setSelectedCategory(catId);
    setSelectedProduct(""); // reset product when category changes
    setQuantity("");
    setErrorMsg(null);
  }

  function handleProductChange(productId: string) {
    setSelectedProduct(productId);
    setErrorMsg(null);
    const prod = products.find((p) => p.id === productId);
    if (prod?.wholesale_moq && prod.wholesale_moq > 0) {
      const currentQty = parseInt(quantity, 10);
      if (!quantity.trim() || isNaN(currentQty) || currentQty < prod.wholesale_moq) {
        setQuantity(String(prod.wholesale_moq));
      }
    }
  }

  function handleQuantityBlur() {
    if (currentMoq > 0 && !quantity.trim()) {
      setQuantity(String(currentMoq));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!contactPerson.trim()) {
      setErrorMsg("Please enter the contact person's name.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMsg("Please enter your company or business name.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter your contact mobile number.");
      return;
    }

    let finalQuantity = quantity.trim();
    if (selectedProductObj && currentMoq > 0) {
      if (!finalQuantity) {
        finalQuantity = String(currentMoq);
        setQuantity(String(currentMoq));
      } else {
        const qtyNum = parseInt(finalQuantity, 10);
        if (isNaN(qtyNum) || qtyNum < currentMoq) {
          setErrorMsg(
            `Minimum order quantity for ${selectedProductObj.name} is ${currentMoq} pieces. Please enter ${currentMoq} or more.`
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/wholesale/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactPerson: contactPerson.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim(), // optional!
          categoryName: selectedCategoryObj?.name || "",
          productName: selectedProductObj?.name || "",
          productId: selectedProductObj?.id || undefined,
          sku: selectedProductObj?.sku || "B2B-WHOLESALE",
          quantity: finalQuantity,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit enquiry.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetForm() {
    setSubmitted(false);
    setContactPerson("");
    setCompanyName("");
    setPhone("");
    setWhatsapp("");
    setEmail("");
    setSelectedCategory("");
    setSelectedProduct("");
    setQuantity("");
    setMessage("");
    setErrorMsg(null);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 md:space-y-12">
        {/* Page Header */}
        {/* <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block px-3 py-1 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            B2B Procurement Desk
          </span>
          <h1 className="text-3xl sm:text-4xl text-[#14231B] tracking-tight">
            Contact Our Team
          </h1>
          <p className="text-xs text-[#5C6460] leading-relaxed">
            Inquire about distributor pricing, carton orders, and GCC logistics
            for licensed pharmacies, beauty salons, and retail cosmetics chains.
          </p>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ── Left Column: Company Details & Communication Channels ── */}
          <div className="lg:col-span-5 space-y-5">
            {/* Quick WhatsApp Card */}
            <div className="bg-white p-6 rounded-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14231B]">
                    WhatsApp Trade Desk
                  </h3>
                  <p className="text-xs text-[#5C6460]">
                    Direct messaging with procurement specialists
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-[#14231B] tracking-wide pt-1">
                +971 50 123 4567
              </p>
              <a
                href="https://wa.me/971501234567"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Direct Phone / Mobile Card */}
            <div className="bg-white p-6 rounded-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14231B]">
                    Mobile &amp; Telephone
                  </h3>
                  <p className="text-xs text-[#5C6460]">
                    Direct voice calls for urgent order inquiries
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <a
                  href="tel:+971501234567"
                  className="text-sm font-semibold text-[#14231B] hover:text-[#183D2B] transition-colors"
                >
                  +971 50 123 4567
                </a>
                <p className="text-[11px] text-[#8E9590] mt-0.5">
                  Mon – Sat, 9:00 AM – 6:00 PM GST
                </p>
              </div>
            </div>

            {/* Electronic Mail Card */}
            <div className="bg-white p-6 rounded-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14231B]">
                    Commercial Email
                  </h3>
                  <p className="text-xs text-[#5C6460]">
                    For RFQs, tender documents, and rate inquiries
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <a
                  href="mailto:wholesale@aurelle.ae"
                  className="text-sm font-semibold text-[#14231B] hover:text-[#183D2B] transition-colors"
                >
                  wholesale@aurelle.ae
                </a>
              </div>
            </div>

            {/* Office & Logistics Facility */}
            <div className="bg-white p-6 rounded-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14231B]">
                    Company &amp; Distribution Center
                  </h3>
                  <p className="text-xs text-[#5C6460]">
                    Aurelle Cosmetics Trading FZ-LLC
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#5C6460] leading-relaxed pt-1">
                Business Center, Meydan Free Zone
                <br />
                Dubai, United Arab Emirates
                <br />
                <span className="text-[#8E9590] text-[11px]">
                  Trade License TRN Registered
                </span>
              </p>
            </div>
          </div>

          {/* ── Right Column: Wholesale Enquiry Form ── */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 md:p-10 rounded-sm">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl sm:text-3xl text-[#14231B]">
                  Enquiry Submitted Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-[#5C6460] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{contactPerson}</strong>. Our commercial B2B
                  desk has received your enquiry for{" "}
                  <strong>{companyName}</strong>. A procurement officer will
                  contact you via phone / WhatsApp shortly.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-6 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl text-[#14231B]">
                    Submit Commercial Enquiry
                  </h2>
                  <p className="text-xs text-[#5C6460] mt-1">
                    Fill in your company and product requirements below. Email
                    is optional.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-sm flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Person Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>

                  {/* Company / Business Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                      Company / Salon / Business{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                      WhatsApp Number{" "}
                      <span className="text-[#8E9590] text-[10px] lowercase">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>
                </div>

                {/* Email Address - NOT MANDATORY */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                    Email Address{" "}
                    <span className="text-[#8E9590] font-normal text-[10px]">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none"
                  />
                </div>

                {/* ── Category & Dynamic Product Selection ── */}
                <div className="pt-2 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#14231B] uppercase tracking-wider">
                    <Layers size={14} />
                    <span>Product Selection</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category Select */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                        Select Category
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] font-medium outline-none cursor-pointer appearance-none"
                        >
                          <option value="">Choose a Category...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E9590] pointer-events-none"
                        />
                      </div>
                    </div>

                    {/* Dynamic Product Select */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                        Select Product
                      </label>
                      <div className="relative">
                        <select
                          value={selectedProduct}
                          onChange={(e) => handleProductChange(e.target.value)}
                          disabled={!selectedCategory || availableProducts.length === 0}
                          className={`w-full h-10 pl-3 pr-8 rounded-sm text-xs font-medium outline-none appearance-none ${
                            !selectedCategory
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-[#FAF8F5] text-[#14231B] cursor-pointer"
                          }`}
                        >
                          <option value="">
                            {!selectedCategory
                              ? "Select a category first..."
                              : availableProducts.length === 0
                              ? "No products in this category"
                              : "Choose a Product..."}
                          </option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}{" "}
                              {p.wholesale_moq
                                ? `(MOQ: ${p.wholesale_moq} pcs)`
                                : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E9590] pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity / Pieces */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B]">
                        Estimated Quantity (Pieces)
                      </label>
                      {currentMoq > 0 && (
                        <span className="text-[10px] text-[#183D2B] font-semibold bg-[#183D2B]/10 px-2 py-0.5 rounded-xs">
                          MOQ: {currentMoq} pcs
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min={currentMoq || 1}
                      step="1"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      onBlur={handleQuantityBlur}
                      className={`w-full h-10 px-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none transition-colors ${
                        isBelowMoq
                          ? "border border-red-500 bg-red-50/40 text-red-900"
                          : ""
                      }`}
                    />
                    {isBelowMoq ? (
                      <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle size={13} className="shrink-0 text-red-600" />
                        <span>
                          Quantity cannot be less than MOQ ({currentMoq} pieces). Please enter {currentMoq} or more.
                        </span>
                      </p>
                    ) : currentMoq > 0 ? (
                      <p className="text-[11px] text-[#5C6460] mt-1">
                        Minimum order quantity is {currentMoq} pieces. You can enter {currentMoq} or more.
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Message / Enquiry Details */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                    Enquiry Details &amp; Trade Notes
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none resize-y"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>
                      {submitting
                        ? "Submitting Enquiry..."
                        : "Submit Wholesale Enquiry"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
