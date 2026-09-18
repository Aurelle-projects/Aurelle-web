"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Percent,
  Truck,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function WholesalePage() {
  const [formData, setFormData] = useState({
    companyName: "",
    tradeLicense: "",
    emirate: "Dubai",
    businessType: "retail_store",
    contactName: "",
    email: "",
    phone: "",
    monthlyBudget: "10k-25k",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            B2B Commercial Partnerships
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1D211F] tracking-tight">
            Wholesale & Trade Inquiries
          </h1>
          <p className="text-sm sm:text-base text-[#5C6460] leading-relaxed">
            Aurelle Cosmetics Trading FZ-LLC supplies verified retailers, beauty salons, luxury pharmacies, and regional distributors across the UAE and GCC.
          </p>
        </div>

        {/* 3 Pillars of Trade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <Percent size={24} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1D211F]">
              Tiered Wholesale Pricing
            </h3>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              Unlock trade margins up to 35% off retail RRP with transparent bulk tier structures and low starter MOQs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <Truck size={24} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1D211F]">
              GCC Pallet & Carton Logistics
            </h3>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              Consolidated temperature-controlled shipping from our Dubai warehouse directly to your retail facilities.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1D211F]">
              Ministry Approved & Regulated
            </h3>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              All formulations comply fully with UAE MoIAT, Dubai Municipality, and GCC cosmetics registration standards.
            </p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs p-6 md:p-12 max-w-3xl mx-auto">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1D211F]">
                Application Received!
              </h2>
              <p className="text-xs text-[#5C6460] max-w-md mx-auto leading-relaxed">
                Thank you for applying to join the Aurelle B2B Network. Our trade operations team will verify your UAE trade license and contact you within 24 business hours.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-full hover:bg-[#102D20] transition-colors mt-2"
              >
                Browse Product Catalog
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-[#DCCFB9]/30 pb-4">
                <h2 className="text-xl font-serif font-bold text-[#1D211F]">
                  Trade Account Application
                </h2>
                <p className="text-xs text-[#5C6460] mt-1">
                  Complete this verification form to access wholesale pricing catalogs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Company Legal Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Al Manara Pharmacy LLC"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    UAE Trade License / TRN # *
                  </label>
                  <input
                    type="text"
                    name="tradeLicense"
                    value={formData.tradeLicense}
                    onChange={handleChange}
                    required
                    placeholder="e.g. CN-1029384"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Emirate / Jurisdiction *
                  </label>
                  <select
                    name="emirate"
                    value={formData.emirate}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
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

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
                  >
                    <option value="retail_store">Retail Store / Pharmacy</option>
                    <option value="salon_spa">Beauty Salon / Spa</option>
                    <option value="ecommerce">E-Commerce Marketplace</option>
                    <option value="distributor">Regional GCC Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Representative Name *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                    placeholder="Full name"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="procurement@company.ae"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+971 50 000 0000"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Estimated Monthly Order Volume
                  </label>
                  <select
                    name="monthlyBudget"
                    value={formData.monthlyBudget}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
                  >
                    <option value="5k-10k">AED 5,000 – AED 10,000</option>
                    <option value="10k-25k">AED 10,000 – AED 25,000</option>
                    <option value="25k-50k">AED 25,000 – AED 50,000</option>
                    <option value="50k+">AED 50,000+</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Specific Categories / Products of Interest
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Specify target quantities, locations, or special distribution requests..."
                    className="w-full p-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-[#183D2B] hover:bg-[#102D20] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send size={15} />
                <span>{isSubmitting ? "Submitting Application..." : "Submit Wholesale Application"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
