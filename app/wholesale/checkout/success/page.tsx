"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Building2, PhoneCall, ArrowRight, Package, ShieldCheck } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number") || searchParams.get("orderNumber") || "AUR-WS-ORDER";
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");

  return (
    <div className="bg-[#FAF8F5] min-h-[75vh] py-12 md:py-20 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-xl border border-[#EFEAE0] shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-[#183D2B]/10 text-[#183D2B] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={38} />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#183D2B] text-white px-2.5 py-1 rounded-xs">
            Wholesale Order Created
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14231B] mt-2">
            Order Submitted Successfully
          </h1>
          <p className="text-xs text-[#8E9590] mt-1">
            Order Reference: <strong className="font-mono text-[#183D2B]">{orderNumber}</strong>
          </p>
        </div>

        {/* Informational Box */}
        <div className="p-4 bg-[#FAF8F5] rounded-lg border border-[#EFEAE0] text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#183D2B] uppercase tracking-wider">
            <PhoneCall size={16} />
            <span>Next Steps for Payment &amp; Dispatch</span>
          </div>

          <ul className="text-xs text-[#5C6460] space-y-2 list-disc pl-4 leading-relaxed">
            <li>
              Your order has been registered in Aurelle&apos;s B2B trade management system.
            </li>
            <li>
              Our B2B account manager will contact you directly via <strong>WhatsApp / Phone</strong> to confirm stock batch reservation and dispatch schedule.
            </li>
            <li>
              Payment settlement and official pro-forma tax invoice will be handled directly prior to warehouse dispatch.
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/wholesale/shop"
            className="flex-1 py-3.5 px-4 bg-[#183D2B] hover:bg-[#102D20] text-white font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/wholesale/account"
            className="flex-1 py-3.5 px-4 border border-[#183D2B] text-[#183D2B] hover:bg-[#183D2B]/5 font-bold text-xs uppercase tracking-wider rounded-sm text-center transition-colors"
          >
            View B2B Account
          </Link>
        </div>

        <div className="pt-3 border-t border-[#EFEAE0] flex items-center justify-center gap-4 text-[11px] text-[#8E9590]">
          <div className="flex items-center gap-1">
            <Building2 size={13} className="text-[#183D2B]" />
            <span>Dubai Logistics Hub</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-[#183D2B]" />
            <span>Verified Trade Order</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WholesaleOrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#FAF8F5] min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
