import React from "react";

export const metadata = {
  title: "Terms of Service | Aurelle Cosmetics Trading FZ-LLC",
  description: "Terms and conditions of sale and platform usage for Aurelle Cosmetics Trading FZ-LLC.",
};

export default function TermsPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Commercial Terms
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1D211F]">
            Terms of Service
          </h1>
          <p className="text-xs text-[#5C6460]">Last updated: September 2026</p>
        </div>

        <div className="bg-white rounded-sm border border-[#DCCFB9]/60 shadow-xs p-8 sm:p-12 space-y-6 text-sm text-[#5C6460] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">1. Entity & Governing Law</h2>
            <p>
              This website and its associated commerce services are operated by <strong>Aurelle Cosmetics Trading FZ-LLC</strong>, a registered company in Dubai, United Arab Emirates. These terms are governed by the federal laws of the UAE and the courts of the Emirate of Dubai.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">2. Pricing & Currency</h2>
            <p>
              All prices quoted on the storefront are denominated in <strong>United Arab Emirates Dirham (AED)</strong> and include the legally mandated 5% UAE Value Added Tax (VAT) unless explicitly specified otherwise for bulk export wholesale accounts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">3. Intellectual Property</h2>
            <p>
              The Aurelle wordmark, crest logo, and product imagery are proprietary assets of Aurelle Cosmetics Trading FZ-LLC. Reproduction or resale without authorized distributor agreements is strictly prohibited.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
