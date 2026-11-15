"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { demoUsers } from "@/lib/auth";
import type { UserRole } from "@/types/domain";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@riax.uz");
  const [password, setPassword] = useState("Demo123!");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const isDemo = demoUsers.some((user) => user.email === email);
      if (isDemo || !isSupabaseConfigured()) {
        const response = await fetch("/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        router.push(data.redirectTo); router.refresh(); return;
      }
      const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const response = await fetch("/api/auth/supabase-session", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      router.push(data.redirectTo); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Kirishda xatolik yuz berdi."); }
    finally { setLoading(false); }
  }

  function selectDemo(role: UserRole) {
    const user = demoUsers.find((item) => item.role === role)!;
    setEmail(user.email); setPassword(user.password); setError("");
  }

  const roleLabels: Record<UserRole, string> = {
    super_admin: "Super Admin", admin: "Kafedra mudiri", department_head: "Kafedra mudiri",
    faculty: "Professor-o‘qituvchi", quality_monitor: "Ta’lim sifati mas’uli",
    research_monitor: "Ilmiy nashrlar mas’uli", graduate_coordinator: "Bitiruv ishlari koordinatori",
    student: "Talaba", mahalla: "Mahalla (tarixiy)",
  };

  return (
    <div className="w-full max-w-[470px] rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_28px_80px_rgba(1,15,55,.28)] backdrop-blur-xl min-[375px]:p-5 sm:rounded-[32px] sm:p-8">
      <div className="mb-5 flex items-center gap-3 sm:mb-7"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#081f5c] text-[#ffd54a] sm:size-11 sm:rounded-2xl"><ShieldCheck size={20}/></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b6fe8] sm:text-xs sm:tracking-[.18em]">Xavfsiz kirish</p><h2 className="font-display text-xl font-black text-[#071230] sm:text-2xl">Platformaga kirish</h2></div></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold text-[#22304f]">Email<div className="mt-2 flex items-center rounded-xl border border-[#d8e3f3] bg-[#f8fbff] px-3 focus-within:border-[#0b6fe8] focus-within:ring-4 focus-within:ring-blue-100 sm:rounded-2xl sm:px-4"><Mail className="mr-3 shrink-0 text-[#6d7b98]" size={18}/><input className="h-12 min-w-0 w-full bg-transparent text-base outline-none sm:h-13 sm:text-sm" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" autoComplete="email" required/></div></label>
        <label className="block text-sm font-bold text-[#22304f]">Parol<div className="mt-2 flex items-center rounded-xl border border-[#d8e3f3] bg-[#f8fbff] px-3 focus-within:border-[#0b6fe8] focus-within:ring-4 focus-within:ring-blue-100 sm:rounded-2xl sm:px-4"><LockKeyhole className="mr-3 shrink-0 text-[#6d7b98]" size={18}/><input className="h-12 min-w-0 w-full bg-transparent text-base outline-none sm:h-13 sm:text-sm" value={password} onChange={(e)=>setPassword(e.target.value)} type={visible ? "text" : "password"} autoComplete="current-password" required/><button type="button" onClick={()=>setVisible(!visible)} className="focus-ring grid size-11 shrink-0 place-items-center rounded-lg text-[#6d7b98]" aria-label={visible?"Parolni yashirish":"Parolni ko‘rsatish"}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={loading} className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08265f] to-[#0b6fe8] font-extrabold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 disabled:opacity-60 sm:h-13 sm:rounded-2xl">{loading?<Loader2 className="animate-spin" size={19}/>:<>Kirish <ArrowRight size={19}/></>}</button>
      </form>
      <div className="mt-5 border-t border-[#e4ebf6] pt-4 sm:mt-6 sm:pt-5"><label className="mb-3 block text-[10px] font-extrabold uppercase tracking-[.13em] text-[#7a879f] sm:text-xs">Demo rolni tanlang<select aria-label="Demo rol" className="input mt-2 normal-case tracking-normal" value={demoUsers.find((user)=>user.email===email)?.role||""} onChange={(event)=>selectDemo(event.target.value as UserRole)}><option value="" disabled>Rolni tanlang</option>{demoUsers.map((user)=><option key={user.email} value={user.role}>{roleLabels[user.role]}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>selectDemo("admin")} className="focus-ring min-h-11 rounded-xl border border-[#dce5f2] bg-[#f8fbff] px-2 text-xs font-bold text-[#12336f]">Kafedra mudiri</button><button type="button" onClick={()=>selectDemo("faculty")} className="focus-ring min-h-11 rounded-xl border border-[#dce5f2] bg-[#f8fbff] px-2 text-xs font-bold text-[#12336f]">Professor</button></div><p className="mt-3 text-center text-[11px] text-[#76839a] sm:text-xs">Parol: <b>Demo123!</b></p></div>
    </div>
  );
}
