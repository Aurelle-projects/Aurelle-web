"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

type FormFields = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  businessType: string;
  expectedOrderVolume: string;
  tradeLicenseUrl: string;
  notes: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;

export default function WholesaleRegisterPage() {
  const [formData, setFormData] = useState<FormFields>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    country: "United Arab Emirates",
    businessType: "Cosmetics & Beauty Retailer",
    expectedOrderVolume: "50-200 Units / Month",
    tradeLicenseUrl: "",
    notes: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Refs for scrolling and focusing
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const successBannerRef = useRef<HTMLDivElement | null>(null);
  const fieldRefs = {
    companyName: useRef<HTMLInputElement | null>(null),
    contactPerson: useRef<HTMLInputElement | null>(null),
    email: useRef<HTMLInputElement | null>(null),
    phone: useRef<HTMLInputElement | null>(null),
    password: useRef<HTMLInputElement | null>(null),
    confirmPassword: useRef<HTMLInputElement | null>(null),
  };

  // Scroll to error banner whenever error state updates
  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [error]);

  // Scroll to success banner when submitted successfully
  useEffect(() => {
    if (submitted && successBannerRef.current) {
      successBannerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [submitted]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-level error on change
    if (fieldErrors[name as keyof FormFields]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const scrollToErrorBanner = () => {
    setTimeout(() => {
      if (errorBannerRef.current) {
        errorBannerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 40);
  };

  const validateForm = (): { isValid: boolean; errors: FieldErrors } => {
    const errors: FieldErrors = {};

    if (!formData.companyName.trim()) {
      errors.companyName = "Company / business name is required.";
    }

    if (!formData.contactPerson.trim()) {
      errors.contactPerson = "Contact person name is required.";
    }

    if (!formData.email.trim()) {
      errors.email = "Business email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid business email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone / mobile number is required.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { isValid, errors } = validateForm();

    if (!isValid) {
      setFieldErrors(errors);

      // Determine primary error message
      const errorKeys = Object.keys(errors) as (keyof FormFields)[];
      const firstKey = errorKeys[0];
      const primaryMessage =
        firstKey && errors[firstKey] && errorKeys.length === 1
          ? errors[firstKey]!
          : "Please correct the highlighted errors before submitting.";

      setError(primaryMessage);

      // Focus first invalid field without abrupt viewport jumping
      if (firstKey && firstKey in fieldRefs) {
        const refKey = firstKey as keyof typeof fieldRefs;
        fieldRefs[refKey]?.current?.focus({ preventScroll: true });
      }

      scrollToErrorBanner();
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/wholesale/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const serverError = data.error || "Failed to submit B2B application.";
        setError(serverError);

        // Map relevant server errors to fields for clear context
        const lower = serverError.toLowerCase();
        if (lower.includes("email") || lower.includes("account")) {
          setFieldErrors((prev) => ({ ...prev, email: serverError }));
          fieldRefs.email.current?.focus({ preventScroll: true });
        } else if (lower.includes("password")) {
          setFieldErrors((prev) => ({ ...prev, password: serverError }));
          fieldRefs.password.current?.focus({ preventScroll: true });
        } else if (lower.includes("company") || lower.includes("business name")) {
          setFieldErrors((prev) => ({ ...prev, companyName: serverError }));
          fieldRefs.companyName.current?.focus({ preventScroll: true });
        } else if (lower.includes("phone")) {
          setFieldErrors((prev) => ({ ...prev, phone: serverError }));
          fieldRefs.phone.current?.focus({ preventScroll: true });
        }

        scrollToErrorBanner();
        return;
      }

      setFieldErrors({});
      setSuccessMessage(data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while submitting your application. Please try again."
      );
      scrollToErrorBanner();
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

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-wider mb-3">
            <Building2 size={14} />
            Official Commercial B2B Registration
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1D211F] font-medium tracking-tight">
            Apply for an Aurelle Wholesale Account
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#5C6460] max-w-xl mx-auto leading-relaxed">
            Gain direct commercial access to genuine luxury cosmetics, starter MOQs, and consolidated GCC logistics. Applications are manually reviewed within 24 hours.
          </p>
        </div>

        {/* Submitted Success Card */}
        {submitted ? (
          <div
            ref={successBannerRef}
            tabIndex={-1}
            role="region"
            aria-label="Registration Success Confirmation"
            className="scroll-mt-28 bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-[#EDE9DF] text-center animate-in fade-in zoom-in duration-200 focus:outline-none"
          >
            <div className="w-16 h-16 bg-[#183D2B]/10 text-[#183D2B] rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="font-serif text-2xl text-[#1D211F] font-semibold mb-3">
              Application Submitted Successfully!
            </h2>
            <p className="text-sm text-[#5C6460] max-w-md mx-auto mb-6 leading-relaxed">
              {successMessage || "Your wholesale registration application has been submitted successfully with account password setup and is pending admin review."}
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
                <span>Upon approval, your account for <strong className="text-[#1D211F]">{formData.email}</strong> will be activated. You can sign in using your email and the password created during registration.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#183D2B] font-bold">3.</span>
                <span>You can then sign in to access wholesale pricing and commercial ordering.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/wholesale"
                className="w-full sm:w-auto px-8 py-3 rounded-md bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider transition-colors text-center shadow-sm"
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
            {/* Global Error Summary */}
            {error && (
              <div
                ref={errorBannerRef}
                tabIndex={-1}
                role="alert"
                aria-live="polite"
                className="scroll-mt-28 mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 shadow-xs animate-in fade-in duration-200 focus:outline-none"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold text-red-800 mb-0.5">Submission Error</p>
                  <p className="text-red-700 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                        ref={fieldRefs.companyName}
                        type="text"
                        name="companyName"
                        required
                        aria-invalid={!!fieldErrors.companyName}
                        aria-describedby={fieldErrors.companyName ? "companyName-error" : undefined}
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Royal Beauty Salons LLC"
                        className={`h-11 w-full rounded-md border ${
                          fieldErrors.companyName
                            ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                            : "border-[#EDE9DF] bg-[#FAF8F5] focus:border-[#183D2B] focus:bg-white focus:ring-[#183D2B]/20"
                        } pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:ring-1`}
                      />
                      <Building2
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          fieldErrors.companyName ? "text-red-500" : "text-[#8C938F]"
                        }`}
                      />
                    </div>
                    {fieldErrors.companyName && (
                      <p
                        id="companyName-error"
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors.companyName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Contact Person Name *
                    </label>
                    <div className="relative">
                      <input
                        ref={fieldRefs.contactPerson}
                        type="text"
                        name="contactPerson"
                        required
                        aria-invalid={!!fieldErrors.contactPerson}
                        aria-describedby={fieldErrors.contactPerson ? "contactPerson-error" : undefined}
                        value={formData.contactPerson}
                        onChange={handleChange}
                        placeholder="e.g. Sarah Mansoor"
                        className={`h-11 w-full rounded-md border ${
                          fieldErrors.contactPerson
                            ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                            : "border-[#EDE9DF] bg-[#FAF8F5] focus:border-[#183D2B] focus:bg-white focus:ring-[#183D2B]/20"
                        } pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:ring-1`}
                      />
                      <User
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          fieldErrors.contactPerson ? "text-red-500" : "text-[#8C938F]"
                        }`}
                      />
                    </div>
                    {fieldErrors.contactPerson && (
                      <p
                        id="contactPerson-error"
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors.contactPerson}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Business Email Address *
                    </label>
                    <div className="relative">
                      <input
                        ref={fieldRefs.email}
                        type="email"
                        name="email"
                        required
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="orders@royalbeauty.ae"
                        className={`h-11 w-full rounded-md border ${
                          fieldErrors.email
                            ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                            : "border-[#EDE9DF] bg-[#FAF8F5] focus:border-[#183D2B] focus:bg-white focus:ring-[#183D2B]/20"
                        } pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:ring-1`}
                      />
                      <Mail
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          fieldErrors.email ? "text-red-500" : "text-[#8C938F]"
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p
                        id="email-error"
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Phone / Mobile Number *
                    </label>
                    <div className="relative">
                      <input
                        ref={fieldRefs.phone}
                        type="tel"
                        name="phone"
                        required
                        aria-invalid={!!fieldErrors.phone}
                        aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+971 50 123 4567"
                        className={`h-11 w-full rounded-md border ${
                          fieldErrors.phone
                            ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                            : "border-[#EDE9DF] bg-[#FAF8F5] focus:border-[#183D2B] focus:bg-white focus:ring-[#183D2B]/20"
                        } pl-10 pr-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:ring-1`}
                      />
                      <Phone
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          fieldErrors.phone ? "text-red-500" : "text-[#8C938F]"
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p
                        id="phone-error"
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors.phone}</span>
                      </p>
                    )}
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
                        className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20 cursor-pointer"
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
                      className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20 cursor-pointer"
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
                      className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20 cursor-pointer"
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
                      className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] px-3.5 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-[#FFFFFF] focus:ring-1 focus:ring-[#183D2B]/20"
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
                      className="w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] p-3 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-[#FFFFFF] focus:ring-1 focus:ring-[#183D2B]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Create Account Password */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#183D2B] mb-4 pb-2 border-b border-[#EDE9DF] flex items-center gap-2">
                  <ShieldCheck size={16} />
                  4. Account Security (Create Password)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Create Account Password *
                    </label>
                    <div className="relative">
                      <input
                        ref={fieldRefs.password}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        minLength={6}
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? "password-error" : undefined}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        className={`h-11 w-full rounded-md border ${
                          fieldErrors.password
                            ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                            : "border-[#EDE9DF] bg-[#FAF8F5] focus:border-[#183D2B] focus:bg-[#FFFFFF] focus:ring-[#183D2B]/20"
                        } pl-3.5 pr-10 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:ring-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C938F] hover:text-[#183D2B] transition-colors cursor-pointer p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p
                        id="password-error"
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D211F] mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        ref={fieldRefs.confirmPassword}
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        required
                        minLength={6}
                        aria-invalid={!!fieldErrors.confirmPassword}
                        aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className={`h-11 w-full rounded-md border ${
                          fieldErrors.confirmPassword
                            ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                            : "border-[#EDE9DF] bg-[#FAF8F5] focus:border-[#183D2B] focus:bg-[#FFFFFF] focus:ring-[#183D2B]/20"
                        } pl-3.5 pr-10 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:ring-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C938F] hover:text-[#183D2B] transition-colors cursor-pointer p-1"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[#5C6460]">
                  This password will be used to log into your Aurelle Wholesale account once approved by admin.
                </p>
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
