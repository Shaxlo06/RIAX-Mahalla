import { NextResponse } from "next/server";
import { demoUsers, roleHome } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const user = demoUsers.find((item) => item.email.toLowerCase() === body?.email?.toLowerCase() && item.password === body?.password);
  if (!user) return NextResponse.json({ message: "Email yoki parol noto‘g‘ri." }, { status: 401 });
  const response = NextResponse.json({ role: user.role, redirectTo: roleHome[user.role], name: user.name });
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 };
  response.cookies.set("riax_role", user.role, options);
  response.cookies.set("riax_name", encodeURIComponent(user.name), options);
  response.cookies.set("riax_user_id", user.id, options);
  return response;
}
