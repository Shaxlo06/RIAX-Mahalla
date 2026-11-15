"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpenCheck, Database, ExternalLink, Quote, RefreshCw, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EntityManager } from "@/components/smart-riax/entity-manager";
import { publicationFields } from "@/components/smart-riax/configs";
import { PageHeader } from "@/components/ui/page-header";
import { useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

type MetricKey = "scopus"|"wos"|"orcid"|"unique"|"citations"|"hindex";

export function PublicationWorkspace(){
  const [selected,setSelected]=useState<MetricKey>("scopus");
  const publications=useSmartCollection<SmartRecord>("scientific_publications");
  const authors=useSmartCollection<SmartRecord>("publication_authors");
  const faculty=useSmartCollection<SmartRecord>("faculty_profiles");
  const bibliometrics=useSmartCollection<SmartRecord>("faculty_bibliometrics");
  const verified=useMemo(()=>unique(publications.rows.filter((row)=>row.verification_status==="verified")),[publications.rows]);
  const scopus=verified.filter((row)=>row.is_scopus_indexed===true);
  const wos=verified.filter((row)=>row.is_wos_indexed===true);
  const orcid=verified.filter((row)=>row.orcid_linked===true);
  const citationKnown=verified.length>0&&verified.every((row)=>row.citations!==null&&row.citations!==undefined&&row.citation_source);
  const citations=citationKnown?verified.reduce((sum,row)=>sum+Number(row.citations||0),0):null;
  const byYear=Object.entries(verified.reduce<Record<string,number>>((acc,row)=>{const key=String(row.publication_year||"Noma’lum");acc[key]=(acc[key]||0)+1;return acc},{})).sort(([a],[b])=>a.localeCompare(b)).map(([year,count])=>({year,count}));
  const quartiles=["Q1","Q2","Q3","Q4"].map((quartile)=>({quartile,count:verified.filter((row)=>row.journal_quartile===quartile).length}));
  const metrics=[
    {key:"scopus" as const,label:"Scopus maqolalari",value:scopus.length,sub:`${teacherCount(scopus,authors.rows)} nafar o‘qituvchi`,icon:BookOpenCheck},
    {key:"wos" as const,label:"Web of Science",value:wos.length,sub:`${teacherCount(wos,authors.rows)} nafar o‘qituvchi`,icon:Database},
    {key:"orcid" as const,label:"ORCID bilan bog‘langan",value:orcid.length,sub:`${teacherCount(orcid,authors.rows)} nafar o‘qituvchi`,icon:UsersRound},
    {key:"unique" as const,label:"Jami noyob nashrlar",value:verified.length,sub:"DOI yoki sarlavha bo‘yicha",icon:BarChart3},
    {key:"citations" as const,label:"Ilmiy iqtiboslar",value:citations??"Ma’lumot yo‘q",sub:citationKnown?"Manbasi qayd etilgan":"Manba kiritilmagan",icon:Quote},
    {key:"hindex" as const,label:"h-index monitoringi",value:bibliometrics.rows.filter((row)=>row.h_index!==null&&row.h_index!==undefined).length||"Ma’lumot yo‘q",sub:"Scopus · WoS · OpenAlex",icon:RefreshCw},
  ];

  return <div className="animate-enter space-y-5">
    <PageHeader eyebrow="Ilmiy faollik monitoringi" title="Ilmiy nashrlar dashboardi" description="Faqat tasdiqlangan indeksatsiya va manbasi ko‘rsatilgan ko‘rsatkichlar hisoblanadi. ORCID nashr indeksatsiyasi sifatida talqin qilinmaydi." icon={BookOpenCheck} action={<Link href="/publications/import" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#08265f] px-4 text-xs font-black text-white"><RefreshCw size={16}/>Import va DOI</Link>}/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(({key,label,value,sub,icon:Icon})=><button key={key} onClick={()=>setSelected(key)} className={`panel group min-h-32 rounded-[22px] border-l-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${selected===key?"border-l-[#f2b705] ring-2 ring-[#f2b705]/30":"border-l-[#0b6fe8]"}`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-black text-[#697790]">{label}</span><Icon size={20} className="text-[#0b6fe8]"/></div><b className="font-display mt-3 block text-3xl text-[#08265f]">{value}</b><small className="mt-1 block font-semibold text-[#7a879d]">{sub}</small></button>)}</div>
    <MetricDetails metric={selected} publications={verified} authors={authors.rows} faculty={faculty.rows} bibliometrics={bibliometrics.rows}/>
    <div className="grid gap-4 xl:grid-cols-2"><Chart title="Yillar bo‘yicha dinamika" data={byYear} dataKey="year"/><Chart title="Kvartillar bo‘yicha taqsimot" data={quartiles} dataKey="quartile"/></div>
    <EntityManager table="scientific_publications" moduleKey="publications" eyebrow="Nashrlar katalogi" title="Ilmiy maqolalar" description="DOI takrorlari aniqlanadi; Scopus va WoS belgisi faqat ishonchli manba bilan tasdiqlanganda qo‘yiladi." fields={publicationFields} columns={["title","authors","journal_or_conference","publication_year","doi","issn","is_scopus_indexed","is_wos_indexed","orcid_linked","journal_quartile","citations","source","verification_status","last_checked_at"]} statusKey="verification_status" storageFolder="scientific-publications" pageSize={10}/>
  </div>;
}

function MetricDetails({metric,publications,authors,faculty,bibliometrics}:{metric:MetricKey;publications:SmartRecord[];authors:SmartRecord[];faculty:SmartRecord[];bibliometrics:SmartRecord[]}){
  const filtered=metric==="scopus"?publications.filter((row)=>row.is_scopus_indexed===true):metric==="wos"?publications.filter((row)=>row.is_wos_indexed===true):metric==="orcid"?publications.filter((row)=>row.orcid_linked===true):publications;
  const teacherRows=faculty.map((member)=>{const ids=new Set(authors.filter((row)=>row.faculty_id===member.id).map((row)=>String(row.publication_id)));return {member,count:filtered.filter((row)=>ids.has(row.id)).length}}).filter((row)=>row.count>0).sort((a,b)=>b.count-a.count);
  return <section className="panel overflow-hidden rounded-[24px]"><div className="border-b border-[#e1e9f3] px-5 py-4"><h2 className="font-display text-lg font-black">{labelFor(metric)}</h2><p className="mt-1 text-xs font-semibold text-[#728098]">Kartochka tanlanganda shu ko‘rsatkichning tekshiriladigan tafsiloti ko‘rsatiladi.</p></div>{metric==="hindex"?<HIndexRows rows={bibliometrics} faculty={faculty}/>:teacherRows.length>0?<div className="divide-y divide-[#e3ebf4]">{teacherRows.map(({member,count})=><Link key={member.id} href={`/faculty/${member.id}`} className="flex min-h-14 items-center justify-between gap-3 px-5 py-3 hover:bg-blue-50"><span className="font-bold">{String(member.full_name)}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#0b6fe8]">{count} ta</span></Link>)}</div>:filtered.length>0?<div className="divide-y divide-[#e3ebf4]">{filtered.slice(0,8).map((row)=><div key={row.id} className="px-5 py-3"><b className="text-sm">{String(row.title)}</b><p className="mt-1 text-xs text-[#728098]">{String(row.journal_or_conference||"Jurnal ko‘rsatilmagan")} · {String(row.publication_year||"Yil yo‘q")}{row.doi&&<> · <a href={`https://doi.org/${row.doi}`} target="_blank" rel="noreferrer" className="text-[#0b6fe8]">DOI <ExternalLink className="inline" size={11}/></a></>}</p></div>)}</div>:<Empty/>}</section>;
}
function HIndexRows({rows,faculty}:{rows:SmartRecord[];faculty:SmartRecord[]}){const known=rows.filter((row)=>row.h_index!==null&&row.h_index!==undefined);return known.length?<div className="table-scroll"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-[#f4f8fd]"><tr><th className="px-5 py-3">O‘qituvchi</th><th>Manba</th><th>h-index</th><th>Tekshirilgan sana</th></tr></thead><tbody>{known.map((row)=><tr key={row.id} className="border-t border-[#e3ebf4]"><td className="px-5 py-3 font-bold">{String(faculty.find((item)=>item.id===row.faculty_id)?.full_name||row.faculty_id)}</td><td>{String(row.provider)}</td><td>{String(row.h_index)}</td><td>{row.checked_at?new Date(String(row.checked_at)).toLocaleDateString("uz-UZ"):"—"}</td></tr>)}</tbody></table></div>:<Empty/>}
function Chart({title,data,dataKey}:{title:string;data:{count:number;[key:string]:string|number}[];dataKey:string}){return <section className="panel rounded-[24px] p-5"><h2 className="font-display text-lg font-black">{title}</h2>{data.some((item)=>item.count>0)?<div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey={dataKey}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#0b6fe8" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>:<Empty/>}</section>}
function Empty(){return <p className="p-8 text-center text-sm font-semibold text-[#75829a]">Tasdiqlangan ma’lumot mavjud emas.</p>}
function unique(rows:SmartRecord[]){const seen=new Set<string>();return rows.filter((row)=>{const key=String(row.doi||row.title||row.id).trim().toLocaleLowerCase("uz");if(seen.has(key))return false;seen.add(key);return true})}
function teacherCount(rows:SmartRecord[],authors:SmartRecord[]){const ids=new Set(rows.map((row)=>row.id));return new Set(authors.filter((row)=>ids.has(String(row.publication_id))&&row.faculty_id).map((row)=>String(row.faculty_id))).size}
function labelFor(metric:MetricKey){return {scopus:"Scopus maqolalari mavjud o‘qituvchilar",wos:"Web of Science nashrlari mavjud o‘qituvchilar",orcid:"ORCID bilan bog‘langan ishlar",unique:"Noyob ilmiy nashrlar",citations:"Iqtiboslar manbalari",hindex:"Manbalar kesimida h-index"}[metric]}
