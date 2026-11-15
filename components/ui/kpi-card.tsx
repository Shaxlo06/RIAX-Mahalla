import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = { gold: "from-[#fff4c9] to-[#ffd766] text-[#6e4700]", blue: "from-[#0d4c9d] to-[#061b4f] text-white", violet: "from-[#f1eaff] to-[#cbb6ff] text-[#30205f]", mint: "from-[#e2fff0] to-[#9ce5bc] text-[#0b5130]", white: "from-white to-[#f1f6ff] text-[#10244b]" };
export function KpiCard({ label, value, hint, icon: Icon, variant="white" }: { label: string; value: string | number; hint?: string; icon: LucideIcon; variant?: keyof typeof variants }) {
  return <article className={cn("relative overflow-hidden rounded-[24px] border border-white/70 bg-gradient-to-br p-4 shadow-[0_12px_30px_rgba(19,55,106,.11)]",variants[variant])}><div className="absolute -right-8 -top-8 size-24 rounded-full bg-white/25"/><div className="relative flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-current/10 bg-white/30"><Icon size={24}/></span><div><p className="text-xs font-extrabold opacity-80">{label}</p><strong className="font-display block text-3xl font-black leading-none sm:text-4xl">{value}</strong>{hint&&<span className="mt-1 block text-[10px] font-bold opacity-65">{hint}</span>}</div></div></article>;
}
