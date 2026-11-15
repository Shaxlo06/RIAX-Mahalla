import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = { gold: "from-[#fff4c9] to-[#ffd766] text-[#6e4700]", blue: "from-[#0d4c9d] to-[#061b4f] text-white", violet: "from-[#f1eaff] to-[#cbb6ff] text-[#30205f]", mint: "from-[#e2fff0] to-[#9ce5bc] text-[#0b5130]", white: "from-white to-[#f1f6ff] text-[#10244b]" };
export function KpiCard({ label, value, hint, icon: Icon, variant="white" }: { label: string; value: string | number; hint?: string; icon: LucideIcon; variant?: keyof typeof variants }) {
  return <article className={cn("kpi-card relative overflow-hidden rounded-[20px] border border-white/70 bg-gradient-to-br p-3 shadow-[0_8px_24px_rgba(19,55,106,.09)] sm:p-4",variants[variant])}><div className="absolute -right-8 -top-8 size-24 rounded-full bg-white/25"/><div className="relative flex items-center gap-3"><span className="kpi-card-icon grid size-11 shrink-0 place-items-center rounded-xl border border-current/10 bg-white/30"><Icon size={22}/></span><div className="min-w-0"><p className="kpi-card-label text-[13px] font-semibold leading-tight opacity-80">{label}</p><strong className="kpi-card-value mt-1 block text-[28px] font-bold leading-none">{value}</strong>{hint&&<span className="kpi-card-hint mt-1 block text-xs font-medium leading-tight opacity-70">{hint}</span>}</div></div></article>;
}
