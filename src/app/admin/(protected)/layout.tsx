import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Server-side re-check of the admin session, in addition to src/middleware.ts.
 * Belt-and-suspenders: covers any request path the middleware matcher might
 * not, and never relies on hiding UI elements alone.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!session) {
    redirect("/admin/login");
  }

  return <AdminShell adminEmail={session.sub}>{children}</AdminShell>;
}
