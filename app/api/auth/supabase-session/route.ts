import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserRole, roleHome } from "@/lib/auth";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sessiya topilmadi." }, { status: 401 });
    const { data: profile, error } = await supabase.from("users").select("full_name, role").eq("id", user.id).single();
    if (error || !isUserRole(profile?.role)) return NextResponse.json({ message: "Foydalanuvchi roli biriktirilmagan." }, { status: 403 });
    const response = NextResponse.json({ role: profile.role, redirectTo: roleHome[profile.role] });
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 };
    response.cookies.set("riax_role", profile.role, options);
    response.cookies.set("riax_name", encodeURIComponent(profile.full_name || user.email || "Foydalanuvchi"), options);
    response.cookies.set("riax_user_id", user.id, options);
    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Auth xatosi" }, { status: 500 });
  }
}
