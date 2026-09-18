import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminLoginPanel from "@/components/admin/AdminLoginPanel";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("aurelle_admin_session");

  if (adminSession?.value === "authenticated") {
    redirect("/admin");
  }

  return <AdminLoginPanel />;
}
