"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SmartRecord } from "@/types/smart-domain";
import facultySeed from "@/data/faculty-profiles.json";
import academicSeed from "@/data/imported-academic-data.json";

const eventName = "smart-riax-data-change";

function storageKey(table: string) {
  return `smart-riax:${table}`;
}

const baselineByTable: Record<string, SmartRecord[]> = {
  faculty_profiles: facultySeed.faculty as unknown as SmartRecord[],
  internship_assignments: academicSeed.internship_assignments as unknown as SmartRecord[],
  graduation_theses: academicSeed.graduation_theses as unknown as SmartRecord[],
  master_dissertations: academicSeed.master_dissertations as unknown as SmartRecord[],
  attestation_candidates: academicSeed.attestation_candidates as unknown as SmartRecord[],
  fourth_year_contingent: academicSeed.fourth_year_contingent as unknown as SmartRecord[],
};

function readLocal<T extends SmartRecord>(table: string): T[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(table)) || "[]") as T[];
    const existingIds = new Set(stored.map((row) => row.id));
    const baseline = (baselineByTable[table] || []) as T[];
    return [...stored, ...baseline.filter((row) => !existingIds.has(row.id))];
  } catch {
    return (baselineByTable[table] || []) as T[];
  }
}

function writeLocal<T extends SmartRecord>(table: string, rows: T[]) {
  localStorage.setItem(storageKey(table), JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(eventName, { detail: table }));
}

export function useSmartCollection<T extends SmartRecord>(table: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const databaseMode = isSupabaseConfigured();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!databaseMode) {
      setRows(readLocal<T>(table));
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await createClient().from(table).select("*").order("created_at", { ascending: false }).limit(1000);
    if (queryError) setError(queryError.message);
    else setRows((data || []) as T[]);
    setLoading(false);
  }, [databaseMode, table]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (!detail || detail === table) void refresh();
    };
    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", sync);
    };
  }, [refresh, table]);

  const create = useCallback(async (values: Omit<T, "id"> & Partial<Pick<T, "id">>) => {
    const now = new Date().toISOString();
    const item = { id: values.id || crypto.randomUUID(), ...values, created_at: now, updated_at: now } as T;
    if (!databaseMode) {
      const next = [item, ...readLocal<T>(table)];
      writeLocal(table, next);
      setRows(next);
      return item;
    }
    const { data, error: insertError } = await createClient().from(table).insert(item as never).select().single();
    if (insertError) throw insertError;
    await refresh();
    return data as T;
  }, [databaseMode, refresh, table]);

  const update = useCallback(async (id: string, values: Partial<T>) => {
    const patch = { ...values, updated_at: new Date().toISOString() };
    if (!databaseMode) {
      const next = readLocal<T>(table).map((row) => row.id === id ? { ...row, ...patch } : row) as T[];
      writeLocal(table, next);
      setRows(next);
      return;
    }
    const { error: updateError } = await createClient().from(table).update(patch).eq("id", id);
    if (updateError) throw updateError;
    await refresh();
  }, [databaseMode, refresh, table]);

  const remove = useCallback(async (id: string) => {
    if (!databaseMode) {
      const next = readLocal<T>(table).filter((row) => row.id !== id);
      writeLocal(table, next);
      setRows(next);
      return;
    }
    const { error: deleteError } = await createClient().from(table).delete().eq("id", id);
    if (deleteError) throw deleteError;
    await refresh();
  }, [databaseMode, refresh, table]);

  return { rows, loading, error, databaseMode, create, update, remove, refresh };
}

export async function uploadSmartDocument(file: File, folder: string) {
  if (!isSupabaseConfigured()) {
    return { file_name: file.name, storage_path: null, mime_type: file.type, demo_only: true };
  }
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Fayl yuklash uchun faol sessiya kerak.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `${userData.user.id}/${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("smart-riax-documents").upload(path, file);
  if (error) throw error;
  return { file_name: file.name, storage_path: path, mime_type: file.type, demo_only: false };
}

export async function downloadExcel(fileName: string, sheetName: string, rows: SmartRecord[]) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows.map(({ id, ...row }) => ({ ID: id, ...row })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, fileName);
}

export function printPdfReport(title: string, rows: SmartRecord[], columns: string[]) {
  const report = window.open("", "_blank", "width=1100,height=800");
  if (!report) throw new Error("Hisobot oynasi bloklandi. Brauzerda pop-up oynalarga ruxsat bering.");
  const escape = (value: unknown) => String(value ?? "—")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  report.document.write(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${escape(title)}</title><style>
    @page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#10264d}h1{font-size:20px;margin:0 0 6px}p{font-size:11px;color:#5d6b82;margin:0 0 16px}table{width:100%;border-collapse:collapse;font-size:9px}th,td{border:1px solid #cad6e6;padding:6px;text-align:left;vertical-align:top}th{background:#08265f;color:white}tr:nth-child(even){background:#f4f8fd}</style></head><body><h1>${escape(title)}</h1><p>${new Date().toLocaleString("uz-UZ")} · ${rows.length} ta yozuv</p><table><thead><tr>${columns.map((column)=>`<th>${escape(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row)=>`<tr>${columns.map((column)=>`<td>${escape(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
  report.document.close();
}
