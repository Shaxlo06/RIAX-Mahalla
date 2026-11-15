"use client";

import Link from "next/link";
import { ArrowLeft, Award, BookOpenCheck, ExternalLink, FileText, GraduationCap, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

export function FacultyProfile({ id }: { id: string }) {
  const faculty = useSmartCollection<SmartRecord>("faculty_profiles");
  const publications = useSmartCollection<SmartRecord>("scientific_publications");
  const authors = useSmartCollection<SmartRecord>("publication_authors");
  const development = useSmartCollection<SmartRecord>("professional_development");
  const certificates = useSmartCollection<SmartRecord>("faculty_certificates");
  const materials = useSmartCollection<SmartRecord>("educational_materials");
  const reviews = useSmartCollection<SmartRecord>("quality_reviews");
  const member = faculty.rows.find((row) => row.id === id);

  if (faculty.loading) return <p className="panel rounded-2xl p-8 text-center text-sm font-semibold">Profil yuklanmoqda...</p>;
  if (!member) return <Empty title="O‘qituvchi topilmadi" text="Havoladagi identifikator bo‘yicha profil mavjud emas." />;

  const publicationIds = new Set(authors.rows.filter((row) => row.faculty_id === id).map((row) => String(row.publication_id)));
  const ownPublications = publications.rows.filter((row) => publicationIds.has(row.id));
  const ownDevelopment = development.rows.filter((row) => row.faculty_id === id);
  const ownCertificates = certificates.rows.filter((row) => row.faculty_id === id);
  const ownMaterials = materials.rows.filter((row) => row.faculty_id === id);
  const materialIds = new Set(ownMaterials.map((row) => row.id));
  const ownReviews = reviews.rows.filter((row) => materialIds.has(String(row.material_id)));
  const averageQuality = ownReviews.length ? ownReviews.reduce((sum, row) => sum + Number(row.overall_score || 0), 0) / ownReviews.length : null;

  return <div className="animate-enter space-y-5">
    <Link href="/faculty" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-black text-[#0b6fe8]"><ArrowLeft size={17}/>Ro‘yxatga qaytish</Link>
    <PageHeader eyebrow="Yagona o‘qituvchi profili" title={String(member.full_name)} description={`${text(member.position)} · ${text(member.department)}`} icon={UserRound}/>
    <section className="panel grid gap-4 rounded-[26px] p-5 md:grid-cols-2 xl:grid-cols-4">
      <Fact label="Ilmiy daraja" value={member.academic_degree}/><Fact label="Ilmiy unvon" value={member.academic_title}/><Fact label="Lavozimi" value={member.position}/><Fact label="Faoliyat holati" value={member.employment_status}/>
      <Identifier label="Scopus Author ID" value={member.scopus_author_id} href={member.scopus_profile_url}/>
      <Identifier label="ORCID ID" value={member.orcid} href={member.orcid ? `https://orcid.org/${member.orcid}` : null}/>
      <Fact label="WoS ResearcherID" value={member.wos_researcher_id}/>
      <Identifier label="Google Scholar" value={member.google_scholar_url ? "Profilni ochish" : null} href={member.google_scholar_url}/>
    </section>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={BookOpenCheck} label="Ilmiy nashrlar" value={ownPublications.length}/>
      <Metric icon={GraduationCap} label="Malaka oshirish" value={ownDevelopment.length}/>
      <Metric icon={Award} label="Sertifikatlar" value={ownCertificates.length}/>
      <Metric icon={FileText} label="Dars kontentlari" value={ownMaterials.length}/>
      <Metric icon={UserRound} label="Ta’lim sifati" value={averageQuality === null ? "Ma’lumot yo‘q" : `${averageQuality.toFixed(1)}%`}/>
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <RecordList title="Ilmiy nashrlar" rows={ownPublications} primary="title" secondary="journal_or_conference"/>
      <RecordList title="Malaka oshirish tarixi" rows={ownDevelopment} primary="activity_name" secondary="provider"/>
      <RecordList title="Sertifikatlar" rows={ownCertificates} primary="certificate_name" secondary="issuing_organization"/>
      <RecordList title="O‘quv kontentlari" rows={ownMaterials} primary="topic" secondary="content_type"/>
    </div>
  </div>;
}

function text(value: unknown) { return value === null || value === undefined || value === "" ? "Ma’lumot mavjud emas" : String(value); }
function Fact({label,value}:{label:string;value:unknown}) { return <div><span className="text-[11px] font-black uppercase tracking-[.08em] text-[#75829a]">{label}</span><p className="mt-1 text-sm font-bold text-[#17345f]">{text(value)}</p></div>; }
function Identifier({label,value,href}:{label:string;value:unknown;href:unknown}) { return <div><span className="text-[11px] font-black uppercase tracking-[.08em] text-[#75829a]">{label}</span>{href?<a href={String(href)} target="_blank" rel="noreferrer" className="focus-ring mt-1 flex items-center gap-1 rounded text-sm font-black text-[#0b6fe8] hover:underline">{text(value)}<ExternalLink size={13}/></a>:<p className="mt-1 text-sm font-bold text-[#75829a]">Ma’lumot mavjud emas</p>}</div>; }
function Metric({icon:Icon,label,value}:{icon:typeof UserRound;label:string;value:number|string}) { return <article className="panel rounded-2xl p-4"><Icon size={19} className="text-[#0b6fe8]"/><span className="mt-3 block text-[11px] font-bold text-[#71809a]">{label}</span><b className="font-display mt-1 block text-2xl text-[#08265f]">{value}</b></article>; }
function RecordList({title,rows,primary,secondary}:{title:string;rows:SmartRecord[];primary:string;secondary:string}) { return <section className="panel rounded-[24px] p-5"><h2 className="font-display text-lg font-black">{title}</h2>{rows.length===0?<p className="mt-4 rounded-xl bg-[#f5f8fc] p-4 text-sm font-semibold text-[#71809a]">Tasdiqlangan ma’lumot kiritilmagan.</p>:<div className="mt-3 divide-y divide-[#e2eaf4]">{rows.slice(0,8).map((row)=><div key={row.id} className="py-3"><b className="block text-sm">{text(row[primary])}</b><span className="mt-1 block text-xs text-[#71809a]">{text(row[secondary])}</span></div>)}</div>}</section>; }
function Empty({title,text}:{title:string;text:string}) { return <div className="panel rounded-[26px] p-10 text-center"><UserRound className="mx-auto text-[#9babc1]"/><h1 className="font-display mt-3 text-xl font-black">{title}</h1><p className="mt-2 text-sm text-[#71809a]">{text}</p><Link href="/faculty" className="mt-5 inline-flex rounded-xl bg-[#08265f] px-4 py-3 text-sm font-black text-white">Ro‘yxatga qaytish</Link></div>; }
