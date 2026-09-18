import React from "react";

export const metadata = {
  title: "Privacy Policy | Aurelle Cosmetics Trading FZ-LLC",
  description: "Privacy policy and data protection terms for Aurelle Cosmetics Trading FZ-LLC.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Legal & Compliance
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1D211F]">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#5C6460]">Last updated: September 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs p-8 sm:p-12 space-y-6 text-sm text-[#5C6460] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">1. Information We Collect</h2>
            <p>
              Aurelle Cosmetics Trading FZ-LLC collects customer information (name, contact email, delivery address in the UAE, phone number) necessary to process orders, facilitate courier logistics, and fulfill regulatory obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">2. Payment Processing & Data Security</h2>
            <p>
              Payment card details are encrypted using industry-standard 256-bit SSL protocols via certified Level 1 PCI-DSS payment gateways. We never store complete credit or debit card numbers on our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">3. B2B Wholesale Documentation</h2>
            <p>
              Trade license records and tax identification certificates submitted via our wholesale portal are held securely and accessed only by authorized compliance personnel to verify legitimacy under UAE commercial laws.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
