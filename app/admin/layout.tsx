import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Console | Aurelle Cosmetics Trading FZ-LLC",
  description: "Administrative console for managing products, categories, media, and orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1D211F]">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
