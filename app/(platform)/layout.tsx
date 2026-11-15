import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { demoAuthEnabled, isUserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  let roleValue: UserRole | undefined;
  let name = "Foydalanuvchi";
  let userId = "";
  if (demoAuthEnabled) {
    const cookieRole = store.get("riax_role")?.value;
    if (isUserRole(cookieRole)) roleValue = cookieRole;
    const encodedName = store.get("riax_name")?.value || name;
    userId = store.get("riax_user_id")?.value || "demo-user";
    try { name = decodeURIComponent(encodedName); } catch { name = encodedName; }
  } else {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getClaims();
      userId = String(data?.claims?.sub || "");
      if (userId) {
        const profile = await supabase.from("users").select("role,full_name,is_active").eq("id",userId).maybeSingle();
        if (profile.data?.is_active !== false && isUserRole(profile.data?.role)) {
          roleValue = profile.data.role;
          name = profile.data.full_name || name;
        }
      }
    } catch { /* redirect below */ }
  }
  if (!roleValue) redirect("/login");
  return <AppShell role={roleValue} name={name} userId={userId}>{children}</AppShell>;
}
