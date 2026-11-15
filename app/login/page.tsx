import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { BrandName } from "@/components/ui/brand-name";
import { PLATFORM_SUBTITLE } from "@/lib/branding";

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] overflow-x-clip bg-[#03133d] lg:grid-cols-[1.15fr_.85fr]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-12 2xl:p-14">
        <Image src="/images/tdiu-building.jpg" alt="Toshkent davlat iqtisodiyot universiteti" fill sizes="(max-width: 1024px) 0vw, 58vw" priority className="object-cover opacity-35"/>
        <div className="absolute inset-0 bg-gradient-to-br from-[#020b25]/95 via-[#062c71]/85 to-[#00143d]/70"/><div className="grid-sheen absolute inset-0"/>
        <div className="relative z-10 flex items-center gap-4"><span className="grid size-20 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-[#f2b705]"><Image src="/images/tsue-logo.png" alt="TSUE" width={84} height={84}/></span><div className="h-14 w-px bg-white/30"/><p className="font-display text-xl font-black uppercase leading-tight">Toshkent davlat<br/>iqtisodiyot universiteti</p></div>
        <div className="relative z-10 max-w-3xl"><p className="mb-5 text-sm font-black uppercase tracking-[.28em] text-[#ffd54a]">Raqamli monitoring platformasi</p><h1 className="font-display text-6xl font-black leading-[.94] xl:text-7xl"><BrandName/></h1><p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-blue-100 xl:text-xl">{PLATFORM_SUBTITLE}</p></div>
        <div className="relative z-10 grid grid-cols-3 gap-3"><div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur"><b className="text-2xl text-[#ffd54a]">168</b><span className="mt-1 block text-xs text-blue-100">Talaba</span></div><div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur"><b className="text-2xl text-[#ffd54a]">135</b><span className="mt-1 block text-xs text-blue-100">MFY manzili</span></div><div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur"><b className="text-2xl text-[#ffd54a]">8</b><span className="mt-1 block text-xs text-blue-100">Loyiha bosqichi</span></div></div>
      </section>
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top_right,#e1ecff,transparent_45%),#f4f8ff] px-3 pb-6 pt-32 min-[375px]:px-5 sm:p-10"><div className="absolute left-4 right-4 top-4 flex items-start gap-3 min-[375px]:left-6 min-[375px]:right-6 lg:hidden"><Image src="/images/tsue-logo.png" alt="TSUE" width={48} height={48} sizes="48px" className="shrink-0 rounded-full bg-white"/><div className="min-w-0"><h1 className="font-display text-lg font-black leading-none"><BrandName/></h1><p className="mt-1.5 max-w-sm text-[11px] font-semibold leading-snug text-blue-100 min-[375px]:text-xs">{PLATFORM_SUBTITLE}</p></div></div><LoginForm/></section>
    </main>
  );
}
