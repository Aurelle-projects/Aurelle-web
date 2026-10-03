import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminLoginPanel from "@/components/admin/AdminLoginPanel";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth/adminSession";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(ADMIN_COOKIE_NAME);

  if (verifyAdminSessionToken(adminSession?.value).valid) {
    redirect("/admin");
  }

  return <AdminLoginPanel />;
}
