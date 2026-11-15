"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ModuleNavItem = { label: string; href: string };

export function ModuleNav({ items }: { items: ModuleNavItem[] }) {
  const pathname = usePathname();
  return <nav aria-label="Modul bo‘limlari" className="table-scroll mb-5 flex gap-2 rounded-2xl border border-[#d7e3f2] bg-white/90 p-2 shadow-sm">{items.map((item)=>{const active=pathname===item.href;return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={cn("focus-ring flex min-h-11 shrink-0 items-center rounded-xl px-4 text-xs font-black transition",active?"bg-[#08265f] text-white shadow-lg shadow-blue-950/20":"text-[#52617b] hover:bg-blue-50 hover:text-[#08265f]")}>{item.label}</Link>})}</nav>;
}

