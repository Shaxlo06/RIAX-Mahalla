"use client";
import { useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2 } from "lucide-react";
import { EntityManager } from "@/components/smart-riax/entity-manager";
import { developmentFields } from "@/components/smart-riax/configs";
import { useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

export function DevelopmentWorkspace(){
  const [now]=useState(()=>Date.now());
  const {rows}=useSmartCollection<SmartRecord>("professional_development");
  const dated=(rows.filter((row)=>row.next_required_date).map((row)=>({...row,days:Math.ceil((Date.parse(String(row.next_required_date))-now)/86400000)})) as (SmartRecord&{days:number})[]).sort((a,b)=>a.days-b.days);
  const dueSoon=dated.filter((row)=>row.days>=0&&row.days<=30).length;
  const overdue=dated.filter((row)=>row.days<0).length;
  return <div className="space-y-8"><div className="grid gap-3 sm:grid-cols-3"><Metric icon={CheckCircle2} label="Yakunlangan" value={rows.filter((row)=>row.status==="completed").length}/><Metric icon={CalendarClock} label="30 kun ichida" value={dueSoon}/><Metric icon={AlertCircle} label="Muddati o‘tgan" value={overdue}/></div>{dated.length>0&&<section className="panel rounded-[24px] p-5"><h2 className="font-display text-xl font-black">Yaqin muddatlar</h2><div className="mt-3 divide-y divide-[#e4ebf4]">{dated.slice(0,6).map((row)=><div key={row.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="font-bold">{String(row["activity_name"]||row["faculty_id"])}</span><span className={`font-black ${row.days<0?"text-red-600":row.days<=30?"text-amber-700":"text-emerald-700"}`}>{row.days<0?`${Math.abs(row.days)} kun o‘tgan`:`${row.days} kun qoldi`}</span></div>)}</div></section>}<EntityManager table="professional_development" moduleKey="faculty" eyebrow="Muddatlar monitoringi" title="Kasbiy rivojlanish va malaka oshirish" description="Oxirgi faoliyat, keyingi majburiy muddat, amal qilish davri va bajarilish holatini kuzating." fields={developmentFields} columns={["faculty_id","activity_name","completed_at","next_required_date","status"]} statusKey="status"/></div>;
}
function Metric({icon:Icon,label,value}:{icon:typeof CheckCircle2;label:string;value:number}){return <article className="panel flex items-center gap-4 rounded-2xl p-4"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#0b6fe8]"><Icon size={20}/></span><div><span className="text-xs font-bold text-[#6c7990]">{label}</span><b className="font-display block text-3xl text-[#08265f]">{value}</b></div></article>}
