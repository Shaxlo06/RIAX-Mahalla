"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

export function GraduateRecordProfile({table,id,back,title}:{table:string;id:string;back:string;title:string}){
  const collection=useSmartCollection<SmartRecord>(table);
  const row=collection.rows.find((item)=>item.id===id);
  if(collection.loading)return <p className="panel rounded-2xl p-8 text-center">Ma’lumot yuklanmoqda...</p>;
  if(!row)return <p className="panel rounded-2xl p-8 text-center">Talaba yozuvi topilmadi.</p>;
  const hidden=new Set(["id","created_at","updated_at","source_file","source_row","source_table","student_id"]);
  return <div className="animate-enter space-y-5"><Link href={back} className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-black text-[#0b6fe8]"><ArrowLeft size={17}/>Ro‘yxatga qaytish</Link><PageHeader eyebrow={title} title={String(row.student_name||"Talaba profili")} description={String(row.academic_group||row.study_program||"Guruh ma’lumoti kiritilmagan")} icon={GraduationCap}/><section className="panel grid gap-4 rounded-[24px] p-5 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(row).filter(([key])=>!hidden.has(key)).map(([key,value])=><div key={key}><span className="text-[10px] font-black uppercase tracking-[.08em] text-[#71809a]">{label(key)}</span><p className="mt-1 break-words text-sm font-bold text-[#17345f]">{format(value)}</p></div>)}</section></div>;
}

function format(value:unknown){if(value===null||value===undefined||value==="")return"Ma’lumot mavjud emas";if(typeof value==="boolean")return value?"Ha":"Yo‘q";if(typeof value==="object")return JSON.stringify(value);return String(value)}
function label(key:string){return ({student_name:"Talaba F.I.Sh.",academic_group:"Guruh",study_program:"Ta’lim yo‘nalishi",organization_name:"Amaliyot tashkiloti",university_supervisor_name:"Amaliyot rahbari",start_date:"Boshlanish sanasi",end_date:"Tugash sanasi",status:"Holati",assessment_result:"Baholash natijasi",exam_date:"Imtihon sanasi",result:"Natijasi",final_grade:"Yakuniy baho",needs_admin_review:"Admin tekshiruvi kerak",match_status:"Moslik holati"} as Record<string,string>)[key]||key.replaceAll("_"," ")}
