"use client";

import { CheckCircle2, Clock3, FolderKanban, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/ui/kpi-card";
import { BrandName } from "@/components/ui/brand-name";
import { StageJourney } from "@/components/projects/stage-journey";
import { StatusPill } from "@/components/ui/status-pill";
import { demoProjects } from "@/lib/project-data";
import type { StudentRecord } from "@/types/domain";

export function MahallaDashboard({ students }: { students: StudentRecord[] }) {
  const groupData = [...new Map(students.map(s => [s.group, 0]))].map(([name]) => ({name, count: students.filter(s => s.group === name).length})).slice(0, 6);
  return <div className="animate-enter space-y-5">
    <section className="glass-dark grid-sheen relative overflow-hidden rounded-[30px] p-6 text-white sm:p-8"><div className="absolute -bottom-20 right-12 size-64 rounded-full border-[26px] border-[#2ba7ff]/30"/><div className="relative"><p className="text-xs font-black uppercase tracking-[.18em] text-[#ffd34d]"><BrandName/> · Mahalla koordinatori</p><h1 className="font-display mt-2 text-4xl font-black sm:text-5xl">Yorqin hayot MFY</h1><p className="mt-4 max-w-2xl text-sm font-semibold text-blue-100">Talabalar faoliyati, mahalla loyihalari va hisobotlarni real vaqtga yaqin kuzating.</p></div></section>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Biriktirilgan talabalar" value={students.length} icon={Users} variant="gold"/><KpiCard label="Faol loyihalar" value={3} icon={FolderKanban} variant="blue"/><KpiCard label="Bajarilgan vazifalar" value={18} icon={CheckCircle2} variant="mint"/><KpiCard label="Amaliyot davri" value="16 hafta" icon={Clock3} variant="violet"/></div>
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]"><article className="panel rounded-[26px] p-5"><h2 className="font-display text-xl font-black">Guruhlar kesimida talabalar</h2><div className="mt-4 h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupData}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e3ebf6"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis hide/><Tooltip/><Bar dataKey="count" fill="#0b6fe8" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></article><article className="panel overflow-hidden rounded-[26px]"><div className="border-b border-[#e1eaf5] p-5"><h2 className="font-display text-xl font-black">Mahalla loyihalari</h2></div>{demoProjects.slice(0,4).map(project=><div key={project.id} className="flex flex-wrap items-center gap-3 border-b border-[#e7edf5] px-5 py-4 last:border-0"><div className="min-w-[220px] flex-1"><b className="block text-sm">{project.title}</b><span className="text-[11px] font-semibold text-[#71809a]">{project.owner}</span></div><StatusPill status={project.status}/><b className="text-sm text-[#0b6fe8]">{project.progress}%</b></div>)}</article></div>
    <StageJourney currentStage="implementation" editable/>
  </div>;
}
