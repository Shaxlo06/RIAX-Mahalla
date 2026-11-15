"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, FileDown, FileText, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EntityManager } from "@/components/smart-riax/entity-manager";
import { aiFields, attendanceFields, qualityFields } from "@/components/smart-riax/configs";
import { PageHeader } from "@/components/ui/page-header";
import { downloadExcel, printPdfReport, useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

type Metric="usage"|"attendance"|"ai"|"content"|"active";

export function QualityDashboard(){
  const [metric,setMetric]=useState<Metric>("usage");
  const [period,setPeriod]=useState("90");
  const [now]=useState(()=>Date.now());
  const faculty=useSmartCollection<SmartRecord>("faculty_profiles");
  const materials=useSmartCollection<SmartRecord>("educational_materials");
  const usages=useSmartCollection<SmartRecord>("lesson_content_usage");
  const attendance=useSmartCollection<SmartRecord>("attendance_records");
  const ai=useSmartCollection<SmartRecord>("ai_usage_declarations");
  const cutoff=period==="all"?0:now-Number(period)*86400000;
  const within=(row:SmartRecord)=>!cutoff||!row.created_at||Date.parse(String(row.created_at))>=cutoff;
  const periodMaterials=materials.rows.filter(within);
  const periodUsages=usages.rows.filter(within);
  const periodAttendance=attendance.rows.filter(within);
  const periodAi=ai.rows.filter(within);
  const teachers=useMemo(()=>faculty.rows.filter((row)=>row.is_active!==false&&row.employment_status!=="inactive"),[faculty.rows]);
  const rows=teachers.map((teacher)=>{
    const ownMaterials=periodMaterials.filter((row)=>row.faculty_id===teacher.id);
    const planned=ownMaterials.filter((row)=>row.planned_for_period===true);
    const ownIds=new Set(ownMaterials.map((row)=>row.id));
    const usedIds=new Set(periodUsages.filter((row)=>ownIds.has(String(row.material_id))&&["supervisor_verified","platform_presented"].includes(String(row.usage_type))).map((row)=>String(row.material_id)));
    const attendanceRows=periodAttendance.filter((row)=>row.faculty_id===teacher.id);
    const registered=attendanceRows.reduce((sum,row)=>sum+Number(row.registered_students||0),0);
    const attended=attendanceRows.reduce((sum,row)=>sum+Number(row.attended_students||0),0);
    const aiValues=periodAi.filter((row)=>row.faculty_id===teacher.id).map((row)=>row.declared_usage_percent??(row.human_review_confirmed===true&&row.review_status==="reviewed"?row.automated_indicator:null)).filter((value):value is number=>typeof value==="number");
    return {id:teacher.id,name:String(teacher.full_name),usage:planned.length?usedIds.size/planned.length*100:null,attendance:registered?attended/registered*100:null,ai:aiValues.length?aiValues.reduce((a,b)=>a+b,0)/aiValues.length:null,content:ownMaterials.length,active:1,planned:planned.length,used:usedIds.size,registered,attended};
  });
  const average=(key:"usage"|"attendance"|"ai")=>{const known=rows.map((row)=>row[key]).filter((value):value is number=>typeof value==="number");return known.length?known.reduce((a,b)=>a+b,0)/known.length:null};
  const usage=average("usage"),attendanceAverage=average("attendance"),aiAverage=average("ai");
  const cards=[
    {key:"usage" as const,label:"Kontentdan foydalanish",value:formatPercent(usage),icon:CheckCircle2},
    {key:"attendance" as const,label:"Talabalar qatnashuvi",value:formatPercent(attendanceAverage),icon:UsersRound},
    {key:"ai" as const,label:"AI’dan foydalanish",value:aiAverage===null?"Aniqlanmagan":formatPercent(aiAverage),icon:Bot},
    {key:"content" as const,label:"Jami yuklangan kontent",value:periodMaterials.length,icon:FileText},
    {key:"active" as const,label:"Faol o‘qituvchilar",value:teachers.length,icon:UsersRound},
  ];
  const exportRows=rows.map((row)=>({id:row.id,teacher:row.name,content_usage_percent:row.usage,attendance_percent:row.attendance,ai_usage_percent:row.ai,uploaded_content:row.content,registered_students:row.registered,attended_students:row.attended}));
  const chartData=rows.map((row)=>({name:shortName(row.name),value:row[metric]})).filter((row)=>typeof row.value==="number");

  return <div className="animate-enter space-y-5">
    <PageHeader eyebrow="Dalilga asoslangan monitoring" title="Ta’lim sifati dashboardi" description="Davomat, kontentdan foydalanish va AI deklaratsiyasi faqat kiritilgan yoki tasdiqlangan ma’lumotdan hisoblanadi." icon={CheckCircle2} action={<div className="flex flex-wrap gap-2"><select aria-label="Hisobot davri" value={period} onChange={(event)=>setPeriod(event.target.value)} className="input w-40"><option value="30">30 kun</option><option value="90">90 kun</option><option value="365">1 yil</option><option value="all">Barcha davr</option></select><button onClick={()=>downloadExcel("quality-monitoring.xlsx","Sifat monitoringi",exportRows)} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-black"><FileDown size={16}/>Excel</button><button onClick={()=>printPdfReport("Ta’lim sifati monitoringi",exportRows,["teacher","content_usage_percent","attendance_percent","ai_usage_percent","uploaded_content"])} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-black">PDF</button></div>}/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({key,label,value,icon:Icon})=><button key={key} onClick={()=>setMetric(key)} className={`panel rounded-[22px] border-t-4 p-4 text-left transition hover:-translate-y-0.5 ${metric===key?"border-t-[#f2b705] ring-2 ring-[#f2b705]/25":"border-t-[#0b6fe8]"}`}><Icon size={19} className="text-[#0b6fe8]"/><span className="mt-3 block text-[11px] font-bold text-[#71809a]">{label}</span><b className="font-display mt-1 block text-xl text-[#08265f]">{value}</b></button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><section className="panel overflow-hidden rounded-[24px]"><div className="border-b px-5 py-4"><h2 className="font-display text-lg font-black">O‘qituvchilar kesimi</h2></div>{rows.length?<div className="divide-y divide-[#e2eaf4]">{rows.map((row)=><Link href={`/faculty/${row.id}`} key={row.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-blue-50"><div><b className="text-sm">{row.name}</b><p className="mt-1 text-[11px] text-[#71809a]">Rejalashtirilgan: {row.planned} · Tasdiqlangan foydalanish: {row.used}</p></div><span className="text-xs font-black text-[#0b6fe8]">{metricValue(row,metric)}</span></Link>)}</div>:<Empty/>}</section><section className="panel rounded-[24px] p-5"><h2 className="font-display text-lg font-black">Ko‘rsatkich taqsimoti</h2>{chartData.length?<div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="name" fontSize={10}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#0b6fe8" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div>:<Empty/>}</section></div>
    <EntityManager table="attendance_records" moduleKey="quality" eyebrow="Davomat ma’lumotlari" title="Talabalar qatnashuvi" description="Ro‘yxatdagi va qatnashgan talabalar sonini faqat real dars qaydi asosida kiriting." fields={attendanceFields} columns={["lesson_id","faculty_id","registered_students","attended_students","absent_students","verified_at"]}/>
    <EntityManager table="ai_usage_declarations" moduleKey="quality" eyebrow="AI shaffofligi" title="AI’dan foydalanish deklaratsiyalari" description="Fayl matnidan taxminiy mualliflik foizi chiqarilmaydi; deklaratsiya yoki tasdiqlangan audit qiymati saqlanadi." fields={aiFields} columns={["faculty_id","material_id","ai_tool_category","declared_usage_percent","human_review_confirmed","review_status"]} statusKey="review_status"/>
    <EntityManager table="quality_reviews" moduleKey="quality" eyebrow="Sifat baholashi" title="Kontent va dars sifati" description="Tekshiruvchi bahosi, izoh va tuzatish holatini boshqaring." fields={qualityFields} columns={["material_id","overall_score","status","corrective_action_status","comments"]} statusKey="status"/>
  </div>;
}

function formatPercent(value:number|null){return value===null?"Ma’lumot yetarli emas":`${value.toFixed(1)}%`}
function metricValue(row:{usage:number|null;attendance:number|null;ai:number|null;content:number;active:number},metric:Metric){if(metric==="content")return `${row.content} ta`;if(metric==="active")return "Faol";if(metric==="ai"&&row.ai===null)return"Aniqlanmagan";return formatPercent(row[metric])}
function shortName(value:string){const parts=value.split(/\s+/);return parts.slice(0,2).join(" ")}
function Empty(){return <p className="p-8 text-center text-sm font-semibold text-[#71809a]">Hisoblash uchun yetarli ma’lumot kiritilmagan.</p>}
