"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountAuthModal from "@/components/auth/AccountAuthModal";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams ? (searchParams.get("redirect") || searchParams.get("next")) : null;

  const handleClose = () => {
    // If the user arrived from another page on our site (not /login and not a protected /account route),
    // going back returns them to what they were browsing. Otherwise navigate to home '/'.
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      if (
        referrer &&
        referrer.includes(window.location.origin) &&
        !referrer.includes("/login") &&
        !referrer.includes("/account")
      ) {
        router.back();
        return;
      }
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push("/");
  };

  const handleSuccess = () => {
    const target =
      redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : "/account";
    window.location.assign(target);
  };

  return <AccountAuthModal open onClose={handleClose} onSuccess={handleSuccess} />;
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
