import React from "react";


export const metadata = {
  title: "Returns & Exchanges Policy | Aurelle",
  description: "Learn about Aurelle 14-day return and refund policy in the United Arab Emirates.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Customer Assurance
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1D211F]">
            14-Day Returns & Exchanges Policy
          </h1>
          <p className="text-xs text-[#5C6460]">Last updated: September 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs p-8 sm:p-12 space-y-6 text-sm text-[#5C6460] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">1. 14-Day Hassle-Free Returns</h2>
            <p>
              We want you to feel completely confident in every Aurelle essential. You may return any unopened, sealed, and unused item in its original luxury packaging within 14 days of receipt for an exchange or full refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">2. Hygiene & Sanitary Exceptions</h2>
            <p>
              In compliance with UAE health and safety standards for personal cosmetics and hygiene:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Lipsticks, mascaras, skin tints, and facial tools that have been opened or tested cannot be returned.</li>
              <li>Perfumes and body fragrances must retain their original tamper-evident cellophane seals intact.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">3. Damaged or Defective Items</h2>
            <p>
              If an item is damaged during transit or exhibits a manufacturing defect, please contact our concierge within 48 hours of delivery at <strong className="text-[#1D211F]">care@aurelle.ae</strong> with your order number and photos. We will arrange a complimentary courier collection and immediate replacement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
