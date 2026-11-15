import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isUserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const roleValue = store.get("riax_role")?.value;
  if (!isUserRole(roleValue)) redirect("/login");
  const encodedName = store.get("riax_name")?.value || "Foydalanuvchi";
  const userId = store.get("riax_user_id")?.value || "demo-user";
  let name = encodedName;
  try { name = decodeURIComponent(encodedName); } catch { /* keep raw */ }
  return <AppShell role={roleValue} name={name} userId={userId}>{children}</AppShell>;
}
