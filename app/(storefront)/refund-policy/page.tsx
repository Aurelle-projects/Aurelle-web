import React from "react";

export const metadata = {
  title: "Refund Policy | Aurelle Cosmetics Trading FZ-LLC",
  description: "Learn about refund processing timelines and methods for Aurelle in the UAE.",
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Financial Policies
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1D211F]">
            Refund & Settlement Policy
          </h1>
          <p className="text-xs text-[#5C6460]">Last updated: September 2026</p>
        </div>

        <div className="bg-white rounded-sm border border-[#DCCFB9]/60 shadow-xs p-8 sm:p-12 space-y-6 text-sm text-[#5C6460] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">1. Refund Eligibility & Inspection</h2>
            <p>
              Once your return arrives at our Dubai fulfillment warehouse, our quality control team inspects the items within 2 business days. If approved, your refund will be processed immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1D211F]">2. Refund Method & Processing Windows</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Card Payments (Visa / Mastercard / Amex):</strong> Refunds will be issued back to the original card within 5 to 7 UAE banking days.
              </li>
              <li>
                <strong>Cash on Delivery (COD):</strong> Refunds for orders paid in cash are credited via direct UAE bank transfer (IBAN) or instant Aurelle Store Credit.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
