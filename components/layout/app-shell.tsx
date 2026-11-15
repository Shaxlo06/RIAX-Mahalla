"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, X } from "lucide-react";
import { BrandName } from "@/components/ui/brand-name";
import { RoleProvider } from "@/components/auth/role-context";
import { PLATFORM_SUBTITLE } from "@/lib/branding";
import { roleHome } from "@/lib/auth";
import { navByRole } from "@/lib/navigation";
import { useSmartCollection } from "@/lib/smart-data";
import { cn, initials } from "@/lib/utils";
import type { UserRole } from "@/types/domain";
import type { SmartRecord } from "@/types/smart-domain";

const roleLabel: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Kafedra mudiri",
  department_head: "Kafedra mudiri",
  faculty: "Professor-o‘qituvchi",
  quality_monitor: "Ta’lim sifati mas’uli",
  research_monitor: "Ilmiy nashrlar mas’uli",
  graduate_coordinator: "Bitiruv ishlari koordinatori",
  student: "Talaba",
  mahalla: "Tarixiy koordinator",
};

export function AppShell({ children, role, name, userId }: { children: React.ReactNode; role: UserRole; name: string; userId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const bottomItems=useMemo(()=>navByRole[role],[role]);
  const notifications=useSmartCollection<SmartRecord>("notifications");
  const visibleNotifications=notifications.rows.filter((row)=>!row.user_id||row.user_id===userId).slice(0,5);
  const unreadCount=visibleNotifications.filter((row)=>row.is_read!==true).length;
  const homeHref=roleHome[role];
  const searchMatches=searchQuery.trim()?navByRole[role].filter((item)=>item.label.toLocaleLowerCase("uz").includes(searchQuery.toLocaleLowerCase("uz"))):[];

  useEffect(()=>{
    if(!mobileOpen)return;
    const old=document.body.style.overflow;document.body.style.overflow="hidden";
    const close=(event:KeyboardEvent)=>event.key==="Escape"&&setMobileOpen(false);
    document.addEventListener("keydown",close);
    return()=>{document.body.style.overflow=old;document.removeEventListener("keydown",close)};
  },[mobileOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login"); router.refresh();
  }

  const sidebar = <aside aria-label={`${roleLabel[role]} navigatsiyasi`} className="glass-dark flex h-full w-[min(286px,calc(100vw-28px))] shrink-0 flex-col overflow-hidden text-white lg:w-[276px]">
    <Link href={homeHref} aria-label="SMART RIAX bosh sahifasi" className="focus-ring flex min-h-[112px] shrink-0 items-center gap-3 border-b border-white/10 px-4 lg:min-h-[120px] lg:px-5"><span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-[#f2b705] lg:size-14"><Image src="/images/tsue-logo.png" alt="TSUE" width={64} height={64} sizes="56px"/></span><div className="min-w-0"><p className="font-display text-lg font-black tracking-tight lg:text-xl"><BrandName/></p><p className="mt-1 max-w-[174px] text-[8px] font-semibold leading-[1.35] text-blue-200 lg:text-[9px]">{PLATFORM_SUBTITLE}</p></div></Link>
    <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <nav className="space-y-1 px-3 py-4 lg:py-5">
        {navByRole[role].map((item)=>{
          const branchActive=pathname===item.href||pathname.startsWith(`${item.href}/`)||(item.href.startsWith("/graduates")&&pathname.startsWith("/graduates"));
          const expanded=expandedMenus[item.href]??branchActive;
          const Icon=item.icon;

          if(!item.children){
            return <Link data-primary-nav key={item.href} href={item.href} aria-current={branchActive?"page":undefined} onClick={()=>setMobileOpen(false)} className={cn("focus-ring flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-bold text-blue-100 transition motion-reduce:transition-none",branchActive?"bg-gradient-to-r from-[#ffd85a] to-[#f1b400] text-[#061b4f] shadow-lg shadow-black/20":"hover:bg-white/10 hover:text-white")}><Icon size={19}/><span>{item.label}</span>{branchActive&&<span className="ml-auto size-1.5 rounded-full bg-[#061b4f]"/>}</Link>;
          }

          const submenuId=`sidebar-submenu-${item.href.replaceAll("/", "-")}`;
          return <div key={item.href}>
            <button
              type="button"
              data-primary-nav
              aria-expanded={expanded}
              aria-controls={submenuId}
              onClick={()=>{
                setExpandedMenus((current)=>({...current,[item.href]:!expanded}));
                if(!branchActive)router.push(item.href);
              }}
              className={cn("focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-bold text-blue-100 transition motion-reduce:transition-none",branchActive?"bg-white/10 text-white shadow-inner shadow-white/5":"hover:bg-white/10 hover:text-white")}
            >
              <Icon size={19}/>
              <span className="min-w-0 flex-1">{item.label}</span>
              {branchActive&&<span className="size-1.5 shrink-0 rounded-full bg-[#ffd85a]"/>}
              <ChevronDown size={16} className={cn("shrink-0 transition-transform duration-200 motion-reduce:transition-none",expanded&&"rotate-180")}/>
            </button>
            <div id={submenuId} className={cn("grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none",expanded?"grid-rows-[1fr] opacity-100":"grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="relative ml-5 mt-1 space-y-1 border-l border-[#f2b705]/35 pb-1 pl-4">
                  {item.children.map((child)=>{
                    const active=pathname===child.href||pathname.startsWith(`${child.href}/`);
                    return <Link key={child.href} href={child.href} aria-current={active?"page":undefined} onClick={()=>setMobileOpen(false)} className={cn("focus-ring relative flex min-h-10 items-center rounded-lg px-3 py-2 text-[13px] font-bold transition motion-reduce:transition-none",active?"bg-[#f2b705] text-[#061b4f] shadow-md shadow-black/15":"text-blue-100 hover:bg-white/10 hover:text-white")}><span aria-hidden className={cn("absolute -left-[19px] size-2 rounded-full ring-4 ring-[#08265f]",active?"bg-[#ffd85a]":"bg-blue-300/50")}/>{child.label}</Link>;
                  })}
                </div>
              </div>
            </div>
          </div>;
        })}
      </nav>
      <div className="mt-auto space-y-2 px-3 pb-3">
        <div className="pointer-events-none relative aspect-[16/10] select-none overflow-hidden rounded-2xl border border-white/10 bg-[#061b4f] shadow-lg shadow-black/20">
          <Image src="/images/tdiu-building.jpg" alt="Toshkent davlat iqtisodiyot universiteti binosi" fill sizes="(max-width: 1023px) min(286px, calc(100vw - 28px)), 252px" className="object-cover object-[50%_78%]"/>
          <div className="absolute inset-0 bg-gradient-to-t from-[#03102f]/95 via-[#061b4f]/45 to-[#061b4f]/10"/>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f2b705] to-transparent"/>
          <p className="absolute inset-x-3 bottom-2 text-[10px] font-extrabold tracking-wide text-white/90">TDIU bosh binosi</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/8 p-4"><div className="absolute -right-7 -top-7 size-24 rounded-full bg-[#f2b705]/20 blur-xl"/><p className="relative text-xs font-extrabold text-[#ffd85a]">5 yo‘nalishli monitoring</p><p className="relative mt-1 text-[11px] leading-relaxed text-blue-100">Kafedraning ta’lim, ilmiy va bitiruv jarayonlari yagona tizimda.</p></div>
      </div>
    </div>
  </aside>;

  return <RoleProvider role={role} userId={userId}><div className="flex min-h-[100dvh] min-w-0 bg-[#f4f8ff]">
    <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
    {mobileOpen&&<><button aria-label="Menyuni yopish" className="fixed inset-0 z-50 bg-[#020b25]/60 backdrop-blur-sm lg:hidden" onClick={()=>setMobileOpen(false)}/><div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobil navigatsiya" className="fixed inset-y-0 left-0 z-[60] lg:hidden">{sidebar}<button onClick={()=>setMobileOpen(false)} className="focus-ring absolute right-3 top-3 grid size-11 place-items-center rounded-xl bg-white/10 text-white" aria-label="Menyuni yopish"><X size={20}/></button></div></>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-[#dce6f3] bg-white/92 px-3 backdrop-blur-xl min-[430px]:gap-3 min-[430px]:px-4 sm:h-[72px] sm:px-6 lg:h-[76px] lg:px-7 xl:px-8">
        <button className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-[#dbe5f2] text-[#08265f] lg:hidden" onClick={()=>setMobileOpen(true)} aria-label="Menyuni ochish" aria-expanded={mobileOpen} aria-controls="mobile-navigation"><Menu size={21}/></button>
        <Link href={homeHref} className="focus-ring flex min-w-0 items-center gap-2 rounded-xl lg:hidden" aria-label="Bosh sahifa"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-[#f2b705]"><Image src="/images/tsue-logo.png" alt="" width={42} height={42} sizes="36px"/></span><b className="hidden truncate font-display text-sm min-[375px]:block"><BrandName smartClassName="text-[#08265f]"/></b></Link>
        <div className="relative hidden max-w-md flex-1 md:block"><label className="flex items-center gap-2 rounded-xl border border-[#dbe5f2] bg-[#f7faff] px-3"><Search size={17} className="text-[#75839c]"/><span className="sr-only">Platforma bo‘yicha qidirish</span><input value={searchQuery} onChange={(event)=>setSearchQuery(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"&&searchMatches[0]){router.push(searchMatches[0].href);setSearchQuery("")}}} className="h-10 w-full bg-transparent text-sm outline-none" placeholder="Modullar bo‘yicha qidirish..."/></label>{searchMatches.length>0&&<div className="panel absolute inset-x-0 top-12 z-50 rounded-xl p-2">{searchMatches.map((item)=><Link key={item.href} href={item.href} onClick={()=>setSearchQuery("")} className="block rounded-lg px-3 py-2 text-sm font-bold text-[#17386e] hover:bg-blue-50">{item.label}</Link>)}</div>}</div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="relative"><button onClick={()=>{setNotificationsOpen(!notificationsOpen);setProfileOpen(false)}} className="focus-ring relative grid size-11 place-items-center rounded-xl border border-[#dbe5f2] text-[#17386e] hover:bg-blue-50" aria-label="Bildirishnomalar" aria-expanded={notificationsOpen}><Bell size={20}/>{unreadCount>0&&<span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white"/>}</button>{notificationsOpen&&<div role="status" className="panel fixed left-3 right-3 top-[68px] rounded-2xl p-3 sm:absolute sm:left-auto sm:right-0 sm:top-13 sm:w-[310px]"><p className="px-2 py-1 text-sm font-black">Bildirishnomalar</p>{visibleNotifications.length===0?<p className="px-2 py-4 text-xs font-semibold text-[#74819a]">Yangi bildirishnoma mavjud emas.</p>:visibleNotifications.map((item)=><Link key={item.id} href={String(item.action_url||homeHref)} className="mt-1 block min-h-11 w-full rounded-xl px-3 py-2 text-left text-xs text-[#33415f] hover:bg-blue-50"><b className="block">{String(item.title||"Bildirishnoma")}</b><span>{String(item.message||"")}</span></Link>)}</div>}</div>
          <div className="relative"><button onClick={()=>{setProfileOpen(!profileOpen);setNotificationsOpen(false)}} className="focus-ring flex min-h-11 items-center gap-2 rounded-xl p-1 text-left hover:bg-blue-50" aria-label="Profil menyusi" aria-expanded={profileOpen}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#08265f] text-xs font-black text-white">{initials(name)}</span><span className="hidden sm:block"><b className="block max-w-36 truncate text-sm xl:max-w-40">{name}</b><small className="block text-[10px] font-bold text-[#72809a]">{roleLabel[role]}</small></span><ChevronDown size={15} className="hidden text-[#72809a] sm:block"/></button>{profileOpen&&<div className="panel fixed right-3 top-[68px] w-52 rounded-2xl p-2 sm:absolute sm:right-0 sm:top-13"><p className="px-3 py-2 text-xs text-[#72809a]">{roleLabel[role]}</p><button onClick={logout} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><LogOut size={17}/>Chiqish</button></div>}</div>
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-[1680px] px-3 py-4 pb-24 min-[430px]:px-4 sm:p-6 sm:pb-7 lg:p-7 xl:p-8 2xl:px-10">{children}</main>
    </div>
    <nav aria-label="Tezkor navigatsiya" className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#d8e3f1] bg-white/96 px-1 pt-1 shadow-[0_-10px_30px_rgba(6,27,79,.1)] backdrop-blur-xl md:hidden">{bottomItems.map((item)=>{const active=pathname===item.href||pathname.startsWith(`${item.href}/`)||(item.href.startsWith("/graduates")&&pathname.startsWith("/graduates"));const Icon=item.icon;return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={cn("focus-ring flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[8px] font-black",active?"bg-[#eaf2ff] text-[#08265f]":"text-[#68758e]")}><Icon size={18}/><span className="max-w-full truncate">{item.label.replace("Professor-o‘qituvchilar","Ustozlar").replace("Ilmiy nashrlar","Nashrlar").replace("Dars jarayoni","Dars").replace("Ta’lim sifati","Sifat")}</span></Link>})}</nav>
  </div></RoleProvider>;
}
