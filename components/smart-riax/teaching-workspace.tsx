"use client";

import Link from "next/link";
import { BookOpen, Presentation, UsersRound } from "lucide-react";
import { EntityManager } from "@/components/smart-riax/entity-manager";
import { assignmentFields, materialFields, subjectFields } from "@/components/smart-riax/configs";
import { PageHeader } from "@/components/ui/page-header";
import { useSmartCollection } from "@/lib/smart-data";
import type { SmartRecord } from "@/types/smart-domain";

export function TeachingContentWorkspace({mode}:{mode:"lecture"|"practice"}){
  const faculty=useSmartCollection<SmartRecord>("faculty_profiles");
  const lecture=mode==="lecture";
  const allowed=lecture?["lecture_note","presentation","video","manual"]:["practice","seminar","laboratory","presentation","other"];
  return <div className="animate-enter space-y-6">
    <PageHeader eyebrow="Dars jarayoni" title={lecture?"Ma’ruza kontentlari":"Seminar va amaliyot kontentlari"} description={lecture?"O‘qituvchi → biriktirilgan fan → ma’ruza mavzusi va foydalanilgan sana tuzilmasi.":"Amaliy mavzu, topshiriq, laboratoriya materiali, dars ishlanmasi va elektron resurslarni boshqarish."} icon={lecture?BookOpen:Presentation}/>
    <section className="panel rounded-[24px] p-5"><div className="flex items-center gap-2"><UsersRound size={19} className="text-[#0b6fe8]"/><h2 className="font-display text-lg font-black">Kafedra professor-o‘qituvchilari</h2></div>{faculty.rows.length===0?<p className="mt-4 text-sm font-semibold text-[#71809a]">O‘qituvchilar ro‘yxati mavjud emas.</p>:<div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{faculty.rows.filter((row)=>row.is_active!==false).map((row)=><Link key={row.id} href={`/faculty/${row.id}`} className="focus-ring rounded-xl border border-[#dde7f2] px-4 py-3 hover:border-[#0b6fe8] hover:bg-blue-50"><b className="block text-sm">{String(row.full_name)}</b><span className="mt-1 block text-xs text-[#71809a]">{String(row.position||"Lavozim kiritilmagan")}</span></Link>)}</div>}</section>
    <EntityManager table="educational_materials" moduleKey="teaching" eyebrow={lecture?"Ma’ruza":"Seminar/Amaliyot"} title="O‘quv kontentlari" description="Fayl, havola, yuklangan sana va darsda foydalanilgan sana bir yozuvda saqlanadi." fields={materialFields} columns={["faculty_id","subject_id","topic","content_type","file_name","resource_url","uploaded_at","used_lesson_date","approval_status"]} statusKey="approval_status" storageFolder={lecture?"lecture-content":"practice-content"} recordFilter={(row)=>allowed.includes(String(row.content_type))} createDefaults={{id:"",content_type:lecture?"lecture_note":"practice",current_version:"1.0",approval_status:"draft"}} pageSize={10}/>
    <div className="grid gap-6 xl:grid-cols-2"><EntityManager table="subjects" moduleKey="teaching" eyebrow="Admin sozlamasi" title="Fanlar" description="Fanlar hozir majburiy emas; admin keyinchalik fanlarni ro‘yxatga qo‘shadi." fields={subjectFields} columns={["code","name","academic_year","semester","credits"]} storageFolder="syllabi"/><EntityManager table="subject_assignments" moduleKey="teaching" eyebrow="Admin sozlamasi" title="O‘qituvchi va fan biriktirish" description="Fan, o‘qituvchi, guruh va o‘quv yilini bog‘lash." fields={assignmentFields} columns={["subject_id","faculty_id","academic_group","academic_year","semester"]}/></div>
  </div>;
}
