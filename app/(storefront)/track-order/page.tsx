import type { Metadata } from "next";
import { Suspense } from "react";
import TrackOrderClient from "@/components/storefront/TrackOrderClient";

export const metadata: Metadata = {
  title: "Track Your Order — Aurelle",
  description: "Track your Aurelle order and courier delivery status across the UAE in real time without needing to log in.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#183D2B]/20 border-t-[#183D2B] rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}
