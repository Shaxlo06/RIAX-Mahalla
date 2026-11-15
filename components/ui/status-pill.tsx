import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/domain";

const styles: Record<ProjectStatus,string>={planned:"bg-slate-100 text-slate-700",active:"bg-blue-100 text-blue-700",review:"bg-amber-100 text-amber-800",completed:"bg-emerald-100 text-emerald-700",rejected:"bg-red-100 text-red-700"};
const labels: Record<ProjectStatus,string>={planned:"Rejalashtirilgan",active:"Faol",review:"Ko‘rib chiqilmoqda",completed:"Yakunlangan",rejected:"Rad etilgan"};
export function StatusPill({status}:{status:ProjectStatus}){return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-black",styles[status])}>{labels[status]}</span>}
