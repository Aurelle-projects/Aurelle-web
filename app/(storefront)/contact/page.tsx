"use client";

import React, { useState } from "react";
import {
  MapPin,
  Mail,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Customer Care",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Customer Support & Offices
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1D211F] tracking-tight">
            We’re Here to Help
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6460]">
            Get in touch with our Dubai headquarters for order assistance, wholesale inquiries, or cosmetic formulation consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left Column: Contact Cards ─────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#1D211F]">UAE Headquarters</h3>
              <p className="text-xs text-[#5C6460] leading-relaxed">
                Aurelle Cosmetics Trading FZ-LLC
                <br />
                Business Center, Meydan Free Zone
                <br />
                Dubai, United Arab Emirates
              </p>
            </div>

            <div className="bg-white p-6 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                <Clock size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#1D211F]">Operating Hours</h3>
              <p className="text-xs text-[#5C6460] leading-relaxed">
                Monday – Saturday: 9:00 AM – 6:00 PM GST
                <br />
                Sunday: Closed (Online Orders Processed 24/7)
              </p>
            </div>

            <div className="bg-white p-6 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                <Mail size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#1D211F]">Electronic Mail</h3>
              <p className="text-xs text-[#5C6460] leading-relaxed">
                Customer Care: <strong className="text-[#1D211F]">care@aurelle.ae</strong>
                <br />
                Trade & Wholesale: <strong className="text-[#1D211F]">trade@aurelle.ae</strong>
              </p>
            </div>
          </div>

          {/* ── Right 2 Cols: Form ─────────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white rounded-sm border border-[#DCCFB9]/60 shadow-xs p-6 md:p-10">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1D211F]">
                  Message Dispatched!
                </h2>
                <p className="text-xs text-[#5C6460] max-w-sm mx-auto leading-relaxed">
                  Thank you for contacting Aurelle Cosmetics Trading FZ-LLC. One of our customer concierge specialists will reply to <strong>{formData.email}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", subject: "Customer Care", message: "" });
                  }}
                  className="px-6 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-full hover:bg-[#102D20] transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-[#DCCFB9]/30 pb-3">
                  <h2 className="text-xl font-serif font-bold text-[#1D211F]">
                    Send a Direct Message
                  </h2>
                  <p className="text-xs text-[#5C6460] mt-0.5">
                    We usually respond within 2 to 4 hours during UAE business days.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Subject / Department
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none cursor-pointer"
                  >
                    <option value="Customer Care">Customer Care & Order Tracking</option>
                    <option value="Wholesale Inquiry">B2B Wholesale & Trade Licensing</option>
                    <option value="Product Formulation">Product Formulation & INCI Questions</option>
                    <option value="Press & Media">Press, Influencers & Collaborations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can assist you..."
                    className="w-full p-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? "Sending..." : "Submit Message"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
