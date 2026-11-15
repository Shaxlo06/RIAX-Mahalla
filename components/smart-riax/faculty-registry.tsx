"use client";
import { AlertTriangle, BadgeCheck, UserRoundX, UsersRound } from "lucide-react";
import { EntityManager } from "@/components/smart-riax/entity-manager";
import { facultyFields } from "@/components/smart-riax/configs";
import { useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

export function FacultyRegistry(){
  const {rows}=useSmartCollection<SmartRecord>("faculty_profiles");
  const active=rows.filter((row)=>row.is_active!==false&&row.employment_status!=="inactive");
  const matched=active.filter((row)=>row.scopus_status==="source_matched").length;
  const missing=active.filter((row)=>row.scopus_status==="missing"||!row.scopus_author_id).length;
  const conflicts=active.filter((row)=>row.scopus_status==="conflict").length;
  return <div className="space-y-6"><div className="grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4"><Metric icon={UsersRound} label="Jami xodimlar" value={active.length} tone="blue"/><Metric icon={BadgeCheck} label="Scopus ID va havola mos" value={matched} tone="green"/><Metric icon={UserRoundX} label="Scopus profili yo‘q" value={missing} tone="slate"/><Metric icon={AlertTriangle} label="Tekshiruv kerak" value={conflicts} tone="red"/></div><EntityManager table="faculty_profiles" moduleKey="faculty" eyebrow="Scopus ID RIAX.xlsx asosida" title="Professor-o‘qituvchilar reyestri" description="Kafedradagi barcha professor-o‘qituvchilar, ilmiy daraja, unvon, lavozim va Scopus profil ma’lumotlari. Scopus ID ustiga bosilganda manbadagi profil havolasi ochiladi." fields={facultyFields} columns={["full_name","academic_degree","academic_title","position","scopus_author_id","scopus_status"]} statusKey="scopus_status" pageSize={15}/></div>;
}
function Metric({icon:Icon,label,value,tone}:{icon:typeof UsersRound;label:string;value:number;tone:"blue"|"green"|"slate"|"red"}){const colors={blue:"bg-blue-50 text-blue-700",green:"bg-emerald-50 text-emerald-700",slate:"bg-slate-100 text-slate-700",red:"bg-red-50 text-red-700"};return <article className="panel flex items-center gap-3 rounded-2xl p-4"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${colors[tone]}`}><Icon size={20}/></span><div><span className="text-xs font-bold text-[#6b7890]">{label}</span><b className="font-display block text-3xl text-[#08265f]">{value}</b></div></article>}
