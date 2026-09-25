"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Package,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/utils/price";

export interface WholesaleEnquiryModalProduct {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  wholesale_price?: number;
  retail_price?: number;
  wholesale_moq?: number;
  brand?: { name?: string };
  category?: { name?: string; slug?: string };
  image?: string;
}

interface WholesaleEnquiryModalProps {
  open: boolean;
  onClose: () => void;
  product: WholesaleEnquiryModalProduct;
  initialQuantity?: number;
}

export default function WholesaleEnquiryModal({
  open,
  onClose,
  product,
  initialQuantity,
}: WholesaleEnquiryModalProps) {
  const moq = Math.max(1, product.wholesale_moq || 1);

  // Form State
  const [contactPerson, setContactPerson] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState<string>(String(initialQuantity && initialQuantity >= moq ? initialQuantity : moq));
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initialQuantity when modal opens or product changes
  useEffect(() => {
    if (open) {
      const startQty = initialQuantity && initialQuantity >= moq ? initialQuantity : moq;
      setQuantity(String(startQty));
      setErrorMsg(null);
      setSubmitted(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialQuantity, moq]);

  // MOQ check logic (matching WholesaleContactClient)
  const parsedQuantity = parseInt(quantity, 10);
  const isBelowMoq = Boolean(
    moq > 0 &&
      quantity.trim() !== "" &&
      !isNaN(parsedQuantity) &&
      parsedQuantity < moq
  );

  function handleQuantityBlur() {
    const parsed = parseInt(quantity, 10);
    if (moq > 0 && (!quantity.trim() || isNaN(parsed) || parsed < moq)) {
      setQuantity(String(moq));
    }
  }

  // Estimated total calculation
  const unitPrice = product.wholesale_price || product.retail_price || 0;
  const estimatedTotal = !isNaN(parsedQuantity) && parsedQuantity > 0 ? unitPrice * parsedQuantity : 0;

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
    if (moq > 0) {
      if (!finalQuantity) {
        finalQuantity = String(moq);
        setQuantity(String(moq));
      } else {
        const qtyNum = parseInt(finalQuantity, 10);
        if (isNaN(qtyNum) || qtyNum < moq) {
          setErrorMsg(
            `Minimum order quantity for ${product.name} is ${moq} pieces. Please enter ${moq} or more.`
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
          email: email.trim(),
          categoryName: product.category?.name || "General Wholesale",
          productName: product.name,
          productId: product.id,
          sku: product.sku || "B2B-WHOLESALE",
          price: product.wholesale_price || product.retail_price || 0,
          image: product.image || null,
          quantity: `${finalQuantity} pieces`,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit enquiry.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send enquiry. Please try again or contact us directly via WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setContactPerson("");
    setCompanyName("");
    setPhone("");
    setWhatsapp("");
    setEmail("");
    setQuantity(String(moq));
    setMessage("");
    setErrorMsg(null);
    setSubmitted(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-md shadow-2xl z-10 overflow-hidden border border-[#EDE9DF]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE9DF] bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#183D2B]" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#14231B]">
                    Wholesale Order Enquiry
                  </h3>
                  <p className="text-[11px] text-[#5C6460]">
                    Direct B2B trade quotation &amp; freight confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#5C6460] hover:text-[#14231B] rounded-sm transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {submitted ? (
                /* Success View */
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 text-[#183D2B] rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h4 className="text-lg font-bold text-[#14231B]">
                      Enquiry Received Successfully!
                    </h4>
                    <p className="text-xs text-[#5C6460] leading-relaxed">
                      Thank you for your interest in <strong>{product.name}</strong> ({quantity} units). Our commercial export team will review your order requirements and send an official proforma invoice / quotation within 24 hours.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                    >
                      Done / Close
                    </button>
                    <a
                      href={`https://wa.me/971501234567?text=${encodeURIComponent(
                        `Hi Aurelle Wholesale Team, I just submitted an enquiry for ${product.name} (Quantity: ${quantity} units).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Form View */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selected Product Summary Card */}
                  <div className="flex items-center gap-3 p-3.5 bg-[#FAF8F5] rounded-sm border border-[#EDE9DF]">
                    <div className="w-14 h-14 rounded-xs bg-white border border-[#EDE9DF] shrink-0 overflow-hidden relative flex items-center justify-center">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={22} className="text-[#8E9590]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#183D2B]">
                        {product.brand?.name || "Aurelle Wholesale"}
                      </p>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#14231B] truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-[#183D2B]">
                          {formatPrice(unitPrice)} <span className="text-[10px] font-normal text-[#5C6460]">/ unit</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#183D2B]/10 text-[#183D2B] rounded-xs">
                          MOQ: {moq} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-sm flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Contact Person & Company Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#EDE9DF] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                        Company / Salon / Business <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#EDE9DF] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#EDE9DF] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                        WhatsApp Number <span className="text-[#8E9590] text-[10px] lowercase font-normal">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#EDE9DF] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email & Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                        Business Email <span className="text-[#8E9590] text-[10px] lowercase font-normal">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#EDE9DF] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B] transition-colors"
                      />
                    </div>

                    {/* Quantity with contact-section MOQ logic */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B]">
                          Order Quantity (Units) <span className="text-red-500">*</span>
                        </label>
                        {moq > 0 && (
                          <span className="text-[10px] text-[#183D2B] font-semibold bg-[#183D2B]/10 px-1.5 py-0.5 rounded-xs">
                            Min. {moq} units
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          min={moq}
                          step="1"
                          required
                          value={quantity}
                          onChange={(e) => {
                            setQuantity(e.target.value);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          onBlur={handleQuantityBlur}
                          className={`w-full h-10 px-3 bg-[#FAF8F5] rounded-sm text-xs text-[#14231B] outline-none transition-colors border ${
                            isBelowMoq
                              ? "border-red-500 bg-red-50/40 text-red-900"
                              : "border-[#EDE9DF] focus:border-[#183D2B]"
                          }`}
                        />
                      </div>

                      {isBelowMoq && (
                        <p className="text-[10px] text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0 text-red-600" />
                          <span>
                            Must be at least MOQ ({moq} units).
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estimated order value preview */}
                  {estimatedTotal > 0 && (
                    <div className="flex items-center justify-between p-2.5 bg-[#FAF8F5] rounded-sm border border-[#EDE9DF] text-xs">
                      <span className="text-[#5C6460]">Estimated Goods Subtotal:</span>
                      <span className="font-bold text-[#183D2B] text-sm">
                        {formatPrice(estimatedTotal)}
                        <span className="text-[10px] font-normal text-[#8E9590] ml-1">(excl. 5% VAT)</span>
                      </span>
                    </div>
                  )}

                  {/* Message / Requirements */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14231B] mb-1">
                      Order Notes / Delivery Destination <span className="text-[#8E9590] text-[10px] lowercase font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-3 bg-[#FAF8F5] border border-[#EDE9DF] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B] transition-colors resize-none"
                    />
                  </div>

                  {/* B2B Assurance note */}
                  <div className="flex items-center gap-2 text-[10px] text-[#5C6460] pt-1">
                    <ShieldCheck size={14} className="text-[#183D2B] shrink-0" />
                    <span>Official UAE VAT 5% Tax Invoice &amp; packing slip provided with every wholesale consignment.</span>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting || isBelowMoq}
                      className="w-full py-3 px-6 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Enquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Submit Wholesale Enquiry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
