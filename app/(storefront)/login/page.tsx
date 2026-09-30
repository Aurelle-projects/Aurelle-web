"use client";

import { Suspense } from "react";
import AccountAuthModal from "@/components/auth/AccountAuthModal";

function LoginContent() {
  return <AccountAuthModal open onClose={() => window.location.assign("/")} />;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Suspense fallback={null}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
