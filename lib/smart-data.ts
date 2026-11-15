"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SmartRecord } from "@/types/smart-domain";
import facultySeed from "@/data/faculty-profiles.json";

const eventName = "smart-riax-data-change";

function storageKey(table: string) {
  return `smart-riax:${table}`;
}

function readLocal<T extends SmartRecord>(table: string): T[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(table)) || "[]") as T[];
    if (table !== "faculty_profiles") return stored;
    const existingIds = new Set(stored.map((row) => row.id));
    const baseline = facultySeed.faculty as unknown as T[];
    return [...stored, ...baseline.filter((row) => !existingIds.has(row.id))];
  } catch {
    return table === "faculty_profiles" ? facultySeed.faculty as unknown as T[] : [];
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
