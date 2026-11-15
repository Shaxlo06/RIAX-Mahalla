"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BadgeCheck, BookOpenCheck, BrainCircuit, CalendarClock, FileStack, GraduationCap, Presentation, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrandName } from "@/components/ui/brand-name";
import { KpiCard } from "@/components/ui/kpi-card";
import { PLATFORM_SUBTITLE } from "@/lib/branding";
import { useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

export function SmartDashboard() {
  const [now]=useState(()=>Date.now());
  const dashboardHref=usePathname();
  const faculty=useSmartCollection<SmartRecord>("faculty_profiles");
  const publications=useSmartCollection<SmartRecord>("scientific_publications");
  const materials=useSmartCollection<SmartRecord>("educational_materials");
  const usage=useSmartCollection<SmartRecord>("lesson_content_usage");
  const quality=useSmartCollection<SmartRecord>("quality_reviews");
  const development=useSmartCollection<SmartRecord>("professional_development");
  const ai=useSmartCollection<SmartRecord>("ai_usage_declarations");
  const internships=useSmartCollection<SmartRecord>("internship_assignments");
  const theses=useSmartCollection<SmartRecord>("graduation_theses");
  const attestation=useSmartCollection<SmartRecord>("attestation_results");

  const activeFaculty=faculty.rows.filter((row)=>row.is_active!==false&&row.employment_status!=="inactive").length;
  const verifiedPublications=uniquePublications(publications.rows.filter((row)=>row.verification_status==="verified"));
  const verifiedUsage=usage.rows.filter((row)=>["platform_opened","platform_presented","supervisor_verified"].includes(String(row.usage_type))).length;
  const completedQuality=quality.rows.filter((row)=>row.status==="completed"||row.status==="approved");
  const compliance=completedQuality.length?Math.round(completedQuality.reduce((sum,row)=>sum+Number(row.overall_score||0),0)/completedQuality.length):0;
  const inNinety=now+90*86400000;
  const deadlines=development.rows.filter((row)=>{const due=Date.parse(String(row.next_required_date||""));return due>=now&&due<=inNinety}).length;
  const graduateIds=new Set([...internships.rows,...theses.rows,...attestation.rows].map((row)=>String(row.student_id||"")).filter(Boolean));
  const progressRows=[...internships.rows,...theses.rows].filter((row)=>row.progress!==null&&row.progress!==undefined);
  const graduateProgress=progressRows.length?Math.round(progressRows.reduce((sum,row)=>sum+Number(row.progress||0),0)/progressRows.length):0;
  const publicationByYear=Object.entries(verifiedPublications.reduce<Record<string,number>>((acc,row)=>{const year=String(row.publication_year||"Noma’lum");acc[year]=(acc[year]||0)+1;return acc},{})).map(([year,count])=>({year,count})).sort((a,b)=>a.year.localeCompare(b.year));
  const loading=[faculty,publications,materials,usage,quality,development,ai,internships,theses,attestation].some((source)=>source.loading);
  const hint=(value:number)=>loading?"Yuklanmoqda...":value?"Bazadagi tasdiqlangan yozuvlar":"Ma’lumot kiritilmagan";

  return <div className="smart-dashboard animate-enter space-y-5">
    <section className="dashboard-hero glass-dark relative overflow-hidden rounded-[30px] p-6 text-white sm:p-8"><div className="grid-sheen absolute inset-0 opacity-60"/><div className="absolute -left-16 -top-24 size-64 rounded-full border-[28px] border-[#f2b705]"/><div className="dashboard-hero-content relative z-10 max-w-5xl pl-0 sm:pl-28"><p className="dashboard-hero-eyebrow text-xs font-black uppercase tracking-[.22em] text-[#ffd34d]">Kafedraning raqamli boshqaruv markazi</p><div className="dashboard-brand-row mt-2 flex min-w-0 items-center gap-3"><h1 className="font-display min-w-0 text-4xl font-black sm:text-5xl"><BrandName/></h1><Link href={dashboardHref} aria-label="SMART RIAX Dashboard sahifasi" className="dashboard-department-logo focus-ring grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#ffd34d]/70 bg-white shadow-lg shadow-black/25 sm:size-[52px]"><Image src="/images/riax-logo.jpg" alt="Raqamli iqtisodiyot va axborot xavfsizligi kafedrasi logotipi" width={52} height={52} sizes="52px" className="size-full object-cover"/></Link></div><p className="dashboard-subtitle mt-4 max-w-4xl text-sm font-semibold leading-relaxed text-blue-100 sm:text-base">{PLATFORM_SUBTITLE}</p></div></section>
    <div className="dashboard-kpis grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4"><KpiCard label="Faol professor-o‘qituvchilar" value={activeFaculty} hint={hint(activeFaculty)} icon={UsersRound} variant="gold"/><KpiCard label="Tasdiqlangan ilmiy nashrlar" value={verifiedPublications.length} hint={hint(verifiedPublications.length)} icon={BookOpenCheck} variant="blue"/><KpiCard label="O‘quv materiallari" value={materials.rows.length} hint={hint(materials.rows.length)} icon={FileStack} variant="violet"/><KpiCard label="Dars kontenti dalillari" value={verifiedUsage} hint={hint(verifiedUsage)} icon={Presentation} variant="mint"/><KpiCard label="Kontent muvofiqligi" value={`${compliance}%`} hint={hint(completedQuality.length)} icon={BadgeCheck} variant="mint"/><KpiCard label="Malaka oshirish muddatlari" value={deadlines} hint="Keyingi 90 kun" icon={CalendarClock} variant="gold"/><KpiCard label="Bitiruvchi talabalar" value={graduateIds.size} hint={hint(graduateIds.size)} icon={GraduationCap} variant="blue"/><KpiCard label="Amaliyot / BMI progressi" value={`${graduateProgress}%`} hint={hint(progressRows.length)} icon={Activity} variant="violet"/></div>
    <div className="dashboard-primary grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><DashboardPanel title="Scopus / WoS va nashrlar dinamikasi" empty={!publicationByYear.length} emptyText="Tasdiqlangan ilmiy nashrlar mavjud emas."><div className="dashboard-chart h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={publicationByYear}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dce6f3"/><XAxis dataKey="year"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" name="Nashrlar" fill="#0b6fe8" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div><div className="dashboard-metrics mt-3 flex flex-wrap gap-2 text-xs font-bold"><Metric label="Scopus" value={verifiedPublications.filter((row)=>row.is_scopus_indexed===true).length}/><Metric label="Web of Science" value={verifiedPublications.filter((row)=>row.is_wos_indexed===true).length}/></div></DashboardPanel><DashboardPanel title="Kasbiy rivojlanish" empty={!development.rows.length} emptyText="Malaka oshirish yozuvlari mavjud emas."><StatusRows rows={[{label:"Yakunlangan",value:development.rows.filter((row)=>row.status==="completed").length},{label:"Jarayonda",value:development.rows.filter((row)=>row.status==="in_progress").length},{label:"Muddati o‘tgan",value:development.rows.filter((row)=>row.status==="overdue").length}]} href="/faculty/development"/></DashboardPanel></div>
    <div className="dashboard-secondary grid gap-4 lg:grid-cols-3"><DashboardPanel title="O‘quv kontenti" empty={!materials.rows.length} emptyText="O‘quv materiallari yuklanmagan."><StatusRows rows={[{label:"Tasdiqlangan",value:materials.rows.filter((row)=>row.approval_status==="approved").length},{label:"Ko‘rib chiqishda",value:materials.rows.filter((row)=>row.approval_status==="submitted").length},{label:"Tuzatish kerak",value:materials.rows.filter((row)=>row.approval_status==="revision_required").length}]} href="/teaching/materials"/></DashboardPanel><DashboardPanel title="Ta’lim sifati va AI" empty={!quality.rows.length&&!ai.rows.length} emptyText="Sifat tekshiruvi va AI deklaratsiyasi mavjud emas."><StatusRows rows={[{label:"Sifat tekshiruvlari",value:quality.rows.length},{label:"AI deklaratsiyalari",value:ai.rows.length},{label:"Inson tekshiruvi kerak",value:ai.rows.filter((row)=>row.review_status==="human_review_required").length}]} href="/quality"/><p className="dashboard-ai-note mt-3 rounded-xl bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800"><BrainCircuit className="mr-1 inline" size={14}/>AI indikatorlari isbot emas; yakuniy xulosa faqat inson tekshiruvi bilan beriladi.</p></DashboardPanel><DashboardPanel title="Bitiruv jarayonlari" empty={!graduateIds.size} emptyText="Amaliyot, BMI yoki YADK yozuvlari mavjud emas."><StatusRows rows={[{label:"Amaliyot",value:internships.rows.length},{label:"BMI",value:theses.rows.length},{label:"YADK",value:attestation.rows.length}]} href="/graduates/internships"/></DashboardPanel></div>
  </div>;
}

function uniquePublications(rows:SmartRecord[]){const seen=new Set<string>();return rows.filter((row)=>{const key=String(row.doi||row.title||row.id).trim().toLowerCase();if(seen.has(key))return false;seen.add(key);return true})}
function DashboardPanel({title,empty,emptyText,children}:{title:string;empty:boolean;emptyText:string;children:React.ReactNode}){return <section className="dashboard-panel panel rounded-[24px] p-5"><h2 className="font-display text-xl font-black text-[#10244b]">{title}</h2>{empty?<div className="dashboard-empty mt-5 rounded-2xl border border-dashed border-[#bfd0e5] bg-[#f8fbff] p-7 text-center text-sm font-semibold text-[#71809a]">{emptyText}</div>:<div className="dashboard-panel-content mt-4">{children}</div>}</section>}
function Metric({label,value}:{label:string;value:number}){return <span className="rounded-full bg-[#edf4ff] px-3 py-2 text-[#0a2d70]">{label}: {value}</span>}
function StatusRows({rows,href}:{rows:{label:string;value:number}[];href:string}){return <div className="dashboard-status-rows">{rows.map((row)=><div key={row.label} className="dashboard-status-row flex items-center justify-between border-b border-[#e7edf5] py-3 text-sm"><span className="font-semibold text-[#60708a]">{row.label}</span><b className="text-lg text-[#08265f]">{row.value}</b></div>)}<Link href={href} className="dashboard-detail-link focus-ring mt-4 inline-flex rounded-xl bg-[#08265f] px-4 py-2.5 text-xs font-black text-white">Batafsil ko‘rish</Link></div>}
