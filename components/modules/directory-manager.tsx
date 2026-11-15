"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Eye, GraduationCap, Pencil, Plus, Search, ShieldCheck, Trash2, UserRoundCog } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";

export type DirectoryRow = { id: string; name: string; meta: string; count: number };
export type DirectoryPerson = { id: string; fullName: string; group: string; supervisorName: string; phone: string | null };
const directoryIcons = { building: Building2, group: GraduationCap, supervisor: UserRoundCog, users: ShieldCheck };
export type DirectoryIconName = keyof typeof directoryIcons;

type Props = {
  title: string; description: string; eyebrow: string; iconName?: DirectoryIconName;
  rows: DirectoryRow[]; storageKey: string; unit: string;
  details?: Record<string, DirectoryPerson[]>;
};

export function DirectoryManager({ title, description, eyebrow, iconName = "building", rows: initialRows, storageKey, unit, details }: Props) {
  const Icon = directoryIcons[iconName];
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DirectoryRow | null>(null);
  const [selected, setSelected] = useState<DirectoryRow | null>(null);
  const [detailQuery, setDetailQuery] = useState("");
  const [name, setName] = useState("");
  const [meta, setMeta] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    const timer = window.setTimeout(() => { try { setRows(JSON.parse(saved)); } catch {} }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const filtered = useMemo(() => rows.filter((row) => `${row.name} ${row.meta}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const selectedPeople = useMemo(() => (selected ? details?.[selected.id] ?? [] : []).filter((person) => `${person.fullName} ${person.group} ${person.supervisorName}`.toLowerCase().includes(detailQuery.toLowerCase())), [details, detailQuery, selected]);
  const persist = (next: DirectoryRow[]) => { setRows(next); localStorage.setItem(storageKey, JSON.stringify(next)); };
  const create = () => { setEditing(null); setName(""); setMeta(""); setOpen(true); };
  const edit = (row: DirectoryRow) => { setEditing(row); setName(row.name); setMeta(row.meta); setOpen(true); };
  const save = () => {
    if (!name.trim()) return;
    if (editing) persist(rows.map((row) => row.id === editing.id ? { ...row, name, meta } : row));
    else persist([{ id: `local-${Date.now()}`, name, meta, count: 0 }, ...rows]);
    setOpen(false);
  };
  const showDetails = (row: DirectoryRow) => { if (!details?.[row.id]) return; setDetailQuery(""); setSelected(row); };

  return <div className="animate-enter">
    <PageHeader eyebrow={eyebrow} title={title} description={description} icon={Icon} action={<button onClick={create} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#08265f] px-4 py-2.5 text-xs font-black text-white"><Plus size={17}/>Yangi yozuv</button>}/>
    <section className="panel rounded-[26px] p-4 sm:p-5">
      <label className="mb-5 flex max-w-lg items-center gap-2 rounded-xl border border-[#d8e3f1] bg-[#f8fbff] px-3"><Search size={17} className="text-[#71809a]"/><input value={query} onChange={(event)=>setQuery(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Qidirish..."/></label>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((row,index)=><article key={row.id} role={details?.[row.id]?"button":undefined} tabIndex={details?.[row.id]?0:undefined} onClick={()=>showDetails(row)} onKeyDown={(event)=>event.key==="Enter"&&showDetails(row)} className={`rounded-2xl border border-[#dce5f1] bg-gradient-to-br from-white to-[#f4f8ff] p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${details?.[row.id]?"cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100":""}`}>
        <div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#e4efff] text-sm font-black text-[#0b5ecb]">{String(index+1).padStart(2,"0")}</span><div className="flex gap-1"><button onClick={(event)=>{event.stopPropagation();edit(row)}} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50" aria-label="Tahrirlash"><Pencil size={15}/></button><button onClick={(event)=>{event.stopPropagation();if(window.confirm("Yozuv o‘chirilsinmi?"))persist(rows.filter((item)=>item.id!==row.id))}} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="O‘chirish"><Trash2 size={15}/></button></div></div>
        <h2 className="mt-4 font-display text-xl font-black text-[#10244b]">{row.name}</h2><p className="mt-1 min-h-8 text-xs font-medium leading-relaxed text-[#6b7891]">{row.meta}</p>
        <div className="mt-4 flex items-end justify-between border-t border-[#e3eaf3] pt-3"><span className="text-[10px] font-bold uppercase tracking-wide text-[#75829a]">{unit}</span><b className="font-display text-3xl text-[#08265f]">{row.count}</b></div>
        {details?.[row.id]&&<div className="mt-3 flex items-center gap-2 rounded-xl bg-[#eaf2ff] px-3 py-2 text-[11px] font-black text-[#0b5ecb]"><Eye size={14}/>Talabalar va rahbarlarni ko‘rish</div>}
      </article>)}</div>
      {filtered.length===0&&<p className="py-14 text-center text-sm font-bold text-[#78849a]">Yozuv topilmadi.</p>}
    </section>
    <Modal open={open} onClose={()=>setOpen(false)} title={editing?"Yozuvni tahrirlash":"Yangi yozuv"}><div className="space-y-4"><label className="block text-sm font-bold">Nomi<input value={name} onChange={(event)=>setName(event.target.value)} className="input mt-2"/></label><label className="block text-sm font-bold">Qo‘shimcha ma’lumot<textarea value={meta} onChange={(event)=>setMeta(event.target.value)} className="input mt-2 min-h-24 py-3"/></label><button onClick={save} className="h-11 w-full rounded-xl bg-[#08265f] font-black text-white">Saqlash</button></div></Modal>
    <Modal open={Boolean(selected)} onClose={()=>setSelected(null)} title={`${selected?.name ?? ""} — biriktirilgan talabalar`} description="Talabalar, akademik guruh va amaliyot rahbari ro‘yxati." size="lg">
      <label className="mb-4 flex items-center gap-2 rounded-xl border border-[#d8e3f1] bg-[#f8fbff] px-3"><Search size={16}/><input value={detailQuery} onChange={(event)=>setDetailQuery(event.target.value)} className="h-11 flex-1 bg-transparent text-sm outline-none" placeholder="Talaba, guruh yoki rahbar..."/></label>
      <div className="max-h-[55vh] overflow-auto rounded-2xl border border-[#dce5f1]"><table className="w-full min-w-[720px] text-left text-xs"><thead className="sticky top-0 bg-[#08265f] text-white"><tr><th className="px-4 py-3">F.I.Sh.</th><th className="px-3 py-3">Guruh</th><th className="px-3 py-3">Amaliyot rahbari</th><th className="px-4 py-3">Telefon</th></tr></thead><tbody>{selectedPeople.map((person)=><tr key={person.id} className="border-t border-[#e4ebf4]"><td className="px-4 py-3 font-black text-[#10244b]">{person.fullName}</td><td className="px-3 py-3"><span className="rounded-lg bg-blue-50 px-2 py-1 font-black text-blue-700">{person.group}</span></td><td className="px-3 py-3 font-semibold">{person.supervisorName}</td><td className="px-4 py-3">{person.phone??"Kiritilmagan"}</td></tr>)}</tbody></table>{selectedPeople.length===0&&<p className="p-8 text-center text-xs font-bold text-[#71809a]">Talaba topilmadi.</p>}</div>
    </Modal>
  </div>;
}
