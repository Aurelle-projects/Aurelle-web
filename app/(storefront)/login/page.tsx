"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AccountAuthModal from "@/components/auth/AccountAuthModal";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams ? (searchParams.get("redirect") || searchParams.get("next")) : null;
  const target =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/";

  return <AccountAuthModal open onClose={() => window.location.assign(target)} />;
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
