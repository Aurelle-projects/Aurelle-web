"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Layers,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function WholesaleRegisterPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    country: "United Arab Emirates",
    businessType: "Cosmetics & Beauty Retailer",
    expectedOrderVolume: "50-200 Units / Month",
    tradeLicenseUrl: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wholesale/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit B2B application.");
      }

      setSuccessMessage(data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-[#5C6460]">
          <Link href="/wholesale" className="hover:text-[#183D2B] transition-colors">
            Wholesale Portal
          </Link>
          <span>/</span>
          <span className="text-[#1D211F] font-semibold">B2B Registration</span>
        </div>

        {/* Header Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-wider mb-3">
            <Building2 size={14} />
            Official Commercial B2B Registration
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1D211F] font-medium tracking-tight">
            Apply for an Aurelle Wholesale Account
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#5C6460] max-w-xl mx-auto line-relaxed">
            Gain direct commercial access to genuine luxury cosmetics, starter MOQs, and consolidated GCC logistics. Applications are manually reviewed within 24 hours.
          </p>
        </div>

        {/* Submitted Success Card */}
        {submitted ? (
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-[#EDE9DF] text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-[#183D2B]/10 text-[#183D2B] rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="font-serif text-2xl text-[#1D211F] font-semibold mb-3">
              Application Submitted Successfully!
            </h2>
            <p className="text-sm text-[#5C6460] max-w-md mx-auto mb-6 leading-relaxed">
              {successMessage}
            </p>

            <div className="bg-[#FAF8F5] rounded-xl p-5 border border-[#EDE9DF] text-left max-w-md mx-auto mb-8 text-xs text-[#5C6460] space-y-2">
              <div className="font-bold text-[#183D2B] uppercase tracking-wider mb-2">
                What to expect next:
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#183D2B] font-bold">1.</span>
                <span>Our commercial team verifies your company details.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#183D2B] font-bold">2.</span>
                <span>Upon approval, an account activation link is sent to <strong className="text-[#1D211F]">{formData.email}</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#183D2B] font-bold">3.</span>
                <span>You can then sign in to access wholesale pricing and commercial ordering.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/wholesale"
                className="w-full sm:w-auto px-8 py-3 rounded-md bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider transition-colors text-center"
              >
                Return to Wholesale Portal
              </Link>
              <Link
                href="/wholesale/shop"
                className="w-full sm:w-auto px-8 py-3 rounded-md border border-[#183D2B] text-[#183D2B] hover:bg-[#183D2B]/5 text-xs font-bold uppercase tracking-wider transition-colors text-center"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          /* Main Application Form */
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE9DF] p-6 sm:p-10">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Business Identification */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#183D2B] mb-4 pb-2 border-b border-[#EDE9DF] flex items-center gap-2">
                  <Building2 size={16} />
                  1. Business & Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Company / Business Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Royal Beauty Salons LLC"
                        className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                      />
                      <Building2
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C938F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Contact Person Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="contactPerson"
                        required
                        value={formData.contactPerson}
                        onChange={handleChange}
                        placeholder="e.g. Sarah Mansoor"
                        className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                      />
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C938F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Business Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="orders@royalbeauty.ae"
                        className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                      />
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C938F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Phone / Mobile Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+971 50 123 4567"
                        className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                      />
                      <Phone
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C938F]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Business Profile */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#183D2B] mb-4 pb-2 border-b border-[#EDE9DF] flex items-center gap-2">
                  <Briefcase size={16} />
                  2. Business Profile & Requirements
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Country *
                    </label>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                      >
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Oman">Oman</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Other GCC / International">Other GCC / International</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Business Type *
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                    >
                      <option value="Cosmetics & Beauty Retailer">Cosmetics & Beauty Retailer</option>
                      <option value="Pharmacy & Healthcare Store">Pharmacy & Healthcare Store</option>
                      <option value="Salon, Spa & Wellness Center">Salon, Spa & Wellness Center</option>
                      <option value="Commercial Regional Distributor">Commercial Regional Distributor</option>
                      <option value="Hotel & Luxury Hospitality">Hotel & Luxury Hospitality</option>
                      <option value="E-Commerce Retailer">E-Commerce Retailer</option>
                      <option value="Other Business">Other Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Expected Order Volume
                    </label>
                    <select
                      name="expectedOrderVolume"
                      value={formData.expectedOrderVolume}
                      onChange={handleChange}
                      className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                    >
                      <option value="Starter MOQ (10-50 Units)">Starter MOQ (10-50 Units)</option>
                      <option value="50-200 Units / Month">50-200 Units / Month</option>
                      <option value="200-1000 Units / Month">200-1000 Units / Month</option>
                      <option value="Full Pallet Consignments">Full Pallet Consignments</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Trade License & Notes */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#183D2B] mb-4 pb-2 border-b border-[#EDE9DF] flex items-center gap-2">
                  <FileText size={16} />
                  3. Trade License & Additional Notes
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Trade License URL or Reference (Optional)
                    </label>
                    <input
                      type="text"
                      name="tradeLicenseUrl"
                      value={formData.tradeLicenseUrl}
                      onChange={handleChange}
                      placeholder="e.g. License #1234567 or document URL"
                      className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3.5 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Additional Business Requirements or Notes
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Specify targeted brands, preferred delivery timelines, or specific store locations..."
                      className="w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] p-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Submission CTA */}
              <div className="pt-4 border-t border-[#EDE9DF] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#5C6460]">
                  <ShieldCheck size={16} className="text-[#183D2B]" />
                  <span>Manual review before wholesale account activation</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-md bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? "Submitting Application..." : "Submit B2B Application"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
