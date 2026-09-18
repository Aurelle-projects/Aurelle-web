import React from "react";


export const metadata = {
  title: "UAE Shipping & Delivery Policy | Aurelle",
  description: "Learn about Aurelle shipping speeds, rates, and courier coverage across all 7 UAE Emirates.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Logistics & Delivery
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1D211F]">
            UAE Shipping & Fulfillment Policy
          </h1>
          <p className="text-xs text-[#5C6460]">Last updated: September 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs p-8 sm:p-12 space-y-6 text-sm text-[#5C6460] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">1. Domestic Coverage (All 7 Emirates)</h2>
            <p>
              Aurelle Cosmetics Trading FZ-LLC fulfills domestic retail and wholesale orders to all 7 Emirates: Dubai, Abu Dhabi (including Al Ain), Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">2. Delivery Timelines & Dispatch</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Same-Day Dubai Dispatch:</strong> Available for orders placed prior to 2:00 PM GST (Saturday through Thursday).
              </li>
              <li>
                <strong>Standard UAE Delivery (24 to 48 Hours):</strong> Flat-rate courier delivery across all other mainland areas.
              </li>
              <li>
                <strong>Western Region & Remote Island Deliveries:</strong> May require an additional 24 to 48 hours depending on courier schedules.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">3. Shipping Fees & Free Delivery Threshold</h2>
            <p>
              All orders totaling <strong>AED 199 or more</strong> qualify automatically for <strong>Free Standard Shipping</strong> across the United Arab Emirates. Orders below this threshold incur a flat shipping fee of <strong>AED 20</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">4. Temperature-Controlled Integrity</h2>
            <p>
              Because cosmetic formulations, organic botanicals, and perfumes are sensitive to high ambient heat, our delivery fleet operates air-conditioned and climate-controlled transport to safeguard product efficacy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
