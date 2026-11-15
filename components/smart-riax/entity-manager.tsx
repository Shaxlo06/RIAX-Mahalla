"use client";

import { useMemo, useState } from "react";
import { Database, ExternalLink, Eye, FileSpreadsheet, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRole } from "@/components/auth/role-context";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { downloadExcel, uploadSmartDocument, useSmartCollection } from "@/lib/smart-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SmartField, SmartModuleKey, SmartRecord, SmartValue } from "@/types/smart-domain";

type Props = { table: string; moduleKey: SmartModuleKey; title: string; eyebrow: string; description: string; fields: SmartField[]; columns: string[]; statusKey?: string; storageFolder?: string; pageSize?: number };
const arrayFields = new Set(["teaching_subjects", "professional_qualifications", "members"]);
const jsonFields = new Set(["evidence", "evaluation_records", "checklist", "schedule"]);

function normalizeValues(values: SmartRecord) {
  const normalized = { ...values };
  for (const [key, value] of Object.entries(normalized)) {
    if (arrayFields.has(key) && typeof value === "string") normalized[key] = value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
    if (jsonFields.has(key) && typeof value === "string" && value.trim()) {
      try { normalized[key] = JSON.parse(value) as SmartValue; }
      catch { normalized[key] = { izoh: value.trim() } as SmartValue; }
    }
  }
  return normalized;
}

function displayValue(value: SmartValue, field?: SmartField) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ha" : "Yo‘q";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return Object.values(value).join(", ");
  if (field?.type === "select") return field.options?.find((option) => option.value === String(value))?.label || String(value);
  return String(value);
}

export function EntityManager({ table, moduleKey, title, eyebrow, description, fields, columns, statusKey, storageFolder, pageSize = 8 }: Props) {
  const { role, userId, canManage } = useRole();
  const manager = canManage(moduleKey);
  const { rows, loading, error, databaseMode, create, update, remove } = useSmartCollection<SmartRecord>(table);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState(columns[0]);
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SmartRecord | null>(null);
  const [draft, setDraft] = useState<SmartRecord>({ id: "" });
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [message, setMessage] = useState("");
  const visibleFields = fields.filter((field) => !field.restricted || role !== "student");
  const statusOptions = fields.find((field) => field.key === statusKey)?.options || [];
  const fieldMap = Object.fromEntries(fields.map((field) => [field.key, field]));
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("uz");
    return rows
      .filter((row) => !normalizedQuery || Object.values(row).some((value) => String(value ?? "").toLocaleLowerCase("uz").includes(normalizedQuery)))
      .filter((row) => status === "all" || String(row[statusKey || ""] ?? "") === status)
      .sort((a, b) => String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "uz") * (ascending ? 1 : -1));
  }, [ascending, query, rows, sortKey, status, statusKey]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function startEdit(row?: SmartRecord) {
    const initial: SmartRecord = row ? { ...row } : { id: "" };
    if (!row && table === "scientific_publications") initial.submitted_by = userId;
    if (!row && table === "content_versions") initial.uploaded_by = userId;
    if (!row && table === "quality_reviews") initial.reviewer_id = userId;
    if (!row && table === "attestation_results") initial.recorded_by = userId;
    setEditing(row || null); setDraft(initial); setPendingFiles({}); setMessage(""); setOpen(true);
  }

  async function save() {
    for (const field of fields) {
      if (field.required && field.type !== "file" && !String(draft[field.key] ?? "").trim()) { setMessage(`${field.label} maydoni to‘ldirilishi shart.`); return; }
    }
    try {
      const values = { ...draft };
      for (const [key, file] of Object.entries(pendingFiles)) {
        const uploaded = await uploadSmartDocument(file, storageFolder || table);
        values[key] = uploaded.file_name; values.storage_path = uploaded.storage_path; values.mime_type = uploaded.mime_type;
      }
      const normalized = normalizeValues(values);
      if (editing) await update(editing.id, normalized);
      else { const { id: discarded, ...newValues } = normalized; void discarded; await create(newValues); }
      setOpen(false); setMessage("");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Saqlashda xatolik yuz berdi."); }
  }

  async function deleteRow(row: SmartRecord) {
    if (!window.confirm("Ushbu yozuvni o‘chirishni tasdiqlaysizmi?")) return;
    try { await remove(row.id); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "O‘chirishda xatolik yuz berdi."); }
  }

  async function preview(row: SmartRecord) {
    if (!row.storage_path || !isSupabaseConfigured()) { setMessage(row.file_name ? `Demo rejimida faqat fayl nomi saqlandi: ${row.file_name}` : "Ushbu yozuvga fayl biriktirilmagan."); return; }
    const { data, error: signedError } = await createClient().storage.from("smart-riax-documents").createSignedUrl(String(row.storage_path), 60);
    if (signedError) setMessage(signedError.message); else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function changeSort(key: string) {
    if (sortKey === key) setAscending((current) => !current);
    else { setSortKey(key); setAscending(true); }
  }

  return (
    <div className="animate-enter">
      <PageHeader eyebrow={eyebrow} title={title} description={description} icon={Database} action={
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadExcel(`${table}.xlsx`, title, filtered)} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cad8ea] bg-white px-4 text-xs font-black text-[#0a2d70]"><FileSpreadsheet size={17} />Excel</button>
          {manager && <button onClick={() => startEdit()} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#08265f] px-4 text-xs font-black text-white"><Plus size={17} />Yangi yozuv</button>}
        </div>
      } />
      <section className="panel overflow-hidden rounded-[26px]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#dfe8f3] p-4">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#d7e2f0] bg-[#f8fbff] px-3"><Search size={17} /><span className="sr-only">Qidirish</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Barcha maydonlar bo‘yicha qidirish..." /></label>
          {statusOptions.length > 0 && <select aria-label="Holat filtri" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="input w-full sm:w-56"><option value="all">Barcha holatlar</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
          <span className={`rounded-full px-3 py-2 text-[10px] font-black ${databaseMode ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{databaseMode ? "Supabase bazasi" : "Demo · lokal saqlash"}</span>
        </div>
        {message && <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">{message}<button onClick={() => setMessage("")} className="float-right min-h-8 min-w-8" aria-label="Xabarni yopish">×</button></div>}
        {loading ? <div className="p-10 text-center text-sm font-semibold text-[#71809a]">Ma’lumotlar yuklanmoqda...</div> : error ? <div className="p-10 text-center text-sm font-semibold text-red-700">{error}</div> : filtered.length === 0 ? (
          <div className="p-10 text-center"><Database className="mx-auto text-[#a9b9cf]" /><h2 className="mt-3 font-display text-xl font-black">Ma’lumot mavjud emas</h2><p className="mt-1 text-sm text-[#71809a]">Tasdiqlanmagan statistika ko‘rsatilmaydi. {manager ? "Birinchi yozuvni kiriting." : "Vakolatli foydalanuvchi ma’lumot kiritishini kuting."}</p></div>
        ) : (
          <div className="table-scroll"><table className="w-full min-w-[780px] text-left text-xs"><thead className="bg-[#f4f8fd] text-[#62708c]"><tr>
            {columns.map((key) => <th key={key} className="px-4 py-3"><button onClick={() => changeSort(key)} className="font-black">{fieldMap[key]?.label || key} {sortKey === key ? (ascending ? "↑" : "↓") : ""}</button></th>)}<th className="px-4 py-3 text-right">Amallar</th>
          </tr></thead><tbody>{paged.map((row) => <tr key={row.id} className="border-t border-[#e4ebf4] hover:bg-blue-50/40">
            {columns.map((key) => <td key={key} className="max-w-[280px] px-4 py-3 font-semibold text-[#2d3b58]"><CellValue row={row} fieldKey={key} field={fieldMap[key]} /></td>)}
            <td className="px-4 py-3"><div className="flex justify-end gap-1">{(row.file_name || row.storage_path) && <button onClick={() => preview(row)} className="focus-ring grid size-10 place-items-center rounded-xl text-[#0b6fe8] hover:bg-blue-50" aria-label="Faylni ko‘rish"><Eye size={16} /></button>}{manager && <button onClick={() => startEdit(row)} className="focus-ring grid size-10 place-items-center rounded-xl text-[#0b6fe8] hover:bg-blue-50" aria-label="Tahrirlash"><Pencil size={16} /></button>}{manager && <button onClick={() => deleteRow(row)} className="focus-ring grid size-10 place-items-center rounded-xl text-red-600 hover:bg-red-50" aria-label="O‘chirish"><Trash2 size={16} /></button>}</div></td>
          </tr>)}</tbody></table></div>
        )}
        {filtered.length > pageSize && <div className="flex items-center justify-between border-t border-[#e1eaf5] px-4 py-3"><span className="text-xs font-semibold text-[#71809a]">{filtered.length} yozuv · {currentPage}/{pageCount} sahifa</span><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-xl border px-3 py-2 text-xs font-black disabled:opacity-40">Oldingi</button><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-xl border px-3 py-2 text-xs font-black disabled:opacity-40">Keyingi</button></div></div>}
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `${title}: tahrirlash` : `${title}: yangi yozuv`} description="Maydonlarni tasdiqlangan ma’lumotlar asosida to‘ldiring." size="lg">
        <div className="grid gap-4 sm:grid-cols-2">{visibleFields.map((field) => <FieldInput key={field.key} field={field} value={draft[field.key]} onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} onFile={(file) => setPendingFiles((current) => ({ ...current, [field.key]: file }))} />)}</div>
        {message && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>}
        <div className="mt-5 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-[#d5e0ee] px-4 text-sm font-black">Bekor qilish</button><button onClick={save} className="min-h-11 rounded-xl bg-[#08265f] px-5 text-sm font-black text-white">Saqlash</button></div>
      </Modal>
    </div>
  );
}

function CellValue({ row, fieldKey, field }: { row: SmartRecord; fieldKey: string; field?: SmartField }) {
  if (fieldKey === "scopus_author_id") {
    if (!row.scopus_author_id) return <span className="text-[#8793a8]">Mavjud emas</span>;
    if (row.scopus_profile_url) return <a href={String(row.scopus_profile_url)} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 rounded text-[#0b6fe8] hover:underline">{String(row.scopus_author_id)}<ExternalLink size={13}/></a>;
  }
  if (fieldKey === "scopus_status") {
    const status=String(row.scopus_status||"missing");
    const label=status==="source_matched"?"ID va havola mos":status==="conflict"?"Tekshiruv kerak":"Profil mavjud emas";
    const tone=status==="source_matched"?"bg-emerald-50 text-emerald-700":status==="conflict"?"bg-red-50 text-red-700":"bg-slate-100 text-slate-600";
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>{label}</span>;
  }
  return <span className="line-clamp-2">{displayValue(row[fieldKey],field)}</span>;
}

function FieldInput({ field, value, onChange, onFile }: { field: SmartField; value: SmartValue; onChange: (value: SmartValue) => void; onFile: (file: File) => void }) {
  const common = "input mt-2";
  const stringValue = Array.isArray(value) ? value.join(", ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
  if (field.type === "textarea") return <label className="text-sm font-bold sm:col-span-2">{field.label}{field.required && " *"}<textarea value={stringValue} onChange={(event) => onChange(event.target.value)} className={`${common} min-h-28 py-3`} placeholder={field.placeholder} /></label>;
  if (field.type === "select") return <label className="text-sm font-bold">{field.label}{field.required && " *"}<select value={stringValue} onChange={(event) => onChange(event.target.value)} className={common}><option value="">Tanlang</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
  if (field.type === "checkbox") return <label className="mt-6 flex min-h-12 items-center gap-3 rounded-xl bg-[#f5f8fd] px-4 text-sm font-bold"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="size-5 accent-[#0b6fe8]" />{field.label}</label>;
  if (field.type === "file") return <label className="text-sm font-bold sm:col-span-2">{field.label}<input type="file" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])} className={`${common} py-2`} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4" /></label>;
  return <label className="text-sm font-bold">{field.label}{field.required && " *"}<input type={field.type || "text"} value={stringValue} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} className={common} placeholder={field.placeholder} /></label>;
}
