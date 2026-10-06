import React from "react";
import { cookies } from "next/headers";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminLoginPanel from "@/components/admin/AdminLoginPanel";
import { AdminDataProvider } from "@/context/AdminDataContext";

import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth/adminSession";

export const metadata = {
  title: "Admin Console | Aurelle Cosmetics Trading FZ-LLC",
  description: "Administrative console for managing products, categories, media, and orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(ADMIN_COOKIE_NAME);
  const sessionCheck = verifyAdminSessionToken(adminSession?.value);

  // If not authenticated with a valid signed session token, display the Admin Login Panel
  if (!sessionCheck.valid) {
    return <AdminLoginPanel />;
  }

  return (
    <AdminDataProvider>
      <div className="min-h-screen bg-[#F7F6F2] text-[#1D211F]">
        <AdminSidebar />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1 pb-16">
            {children}
          </main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
