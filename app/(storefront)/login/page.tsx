"use client";

import AccountAuthModal from "@/components/auth/AccountAuthModal";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <AccountAuthModal open onClose={() => window.location.assign("/")} />
    </div>
  );
}
