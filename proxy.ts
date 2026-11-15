import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { demoAuthEnabled, isUserRole, roleArea, roleHome } from "@/lib/auth";
import type { UserRole } from "@/types/domain";

const protectedPrefixes = ["/admin", "/student", "/mahalla", "/faculty", "/publications", "/teaching", "/quality", "/graduates"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });
  let role = demoAuthEnabled ? request.cookies.get("riax_role")?.value as UserRole | undefined : undefined;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!role && url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (userId) {
      const profile = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
      if (isUserRole(profile.data?.role)) role = profile.data.role;
    }
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !role) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  const legacyArea = ["admin", "student", "mahalla"].find((area) => pathname.startsWith(`/${area}`));
  if (role && legacyArea && legacyArea !== roleArea(role)) {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }
  if (pathname === "/login" && role) return NextResponse.redirect(new URL(roleHome[role], request.url));
  return response;
}

export const config = { matcher: ["/login", "/admin/:path*", "/student/:path*", "/mahalla/:path*", "/faculty/:path*", "/publications/:path*", "/teaching/:path*", "/quality/:path*", "/graduates/:path*"] };
