import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import type { StudentRecord } from "../types/domain";

type SourceRow = {
  "№"?: number | string;
  FISh?: string;
  Guruhi?: string;
  "Amaliyot o‘tish joyining nomi"?: string;
  "Amaliyot rahbarining lavozimi va FISh"?: string;
  "Talabaning telefon nomeri"?: string | number;
};

const root = process.cwd();
const excelPath = path.resolve(root, process.env.RIAX_EXCEL_PATH || "RIAX.xlsx");
const outputPath = path.resolve(root, "data/riax-data.json");
const sqlPath = path.resolve(root, "supabase/seed.sql");
const sqlOnly = process.argv.includes("--sql-only");

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const sql = (value: string | null) => (value === null ? "null" : `'${value.replaceAll("'", "''")}'`);

function parseAddress(address: string) {
  const parts = address.split(",").map(clean).filter(Boolean);
  const region = parts[0] && parts[0] !== "0" ? parts[0] : "Kiritilmagan";
  const district = parts.find((part) => /tumani|shahri/i.test(part)) ?? null;
  const mahallaPart = parts.find((part) => /\bMFY\b/i.test(part)) ?? null;
  const mahallaName = mahallaPart?.replace(/\bMFY\b/gi, "").trim() || null;
  return { region, district, mahallaName };
}

function parseSupervisor(raw: string) {
  const chunks = raw.split(/\r?\n/).map(clean).filter(Boolean);
  const last = chunks.at(-1) || raw;
  return clean(last.replace(/^Raqamli iqtisodiyot va axborot xavfsizligi\.?/i, "")) || "Kiritilmagan";
}

function normalizePhone(value: unknown) {
  const text = clean(value);
  if (!text || text === "0") return null;
  const digits = text.replace(/\D/g, "");
  return digits.length >= 9 ? `+${digits}` : text;
}

async function readWorkbook() {
  const workbook = XLSX.readFile(excelPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excel faylida varaq topilmadi.");
  const rows = XLSX.utils.sheet_to_json<SourceRow>(workbook.Sheets[sheetName], { defval: "", raw: false });

  const students: StudentRecord[] = rows.map((row, index) => {
    const practiceAddress = clean(row["Amaliyot o‘tish joyining nomi"]);
    const supervisorRaw = clean(row["Amaliyot rahbarining lavozimi va FISh"]);
    const phone = normalizePhone(row["Talabaning telefon nomeri"]);
    const sourceNumber = Number(row["№"] || index + 1);
    return {
      id: `student-${sourceNumber}`,
      sourceRow: sourceNumber,
      fullName: clean(row.FISh),
      group: clean(row.Guruhi),
      practiceAddress,
      supervisorRaw,
      supervisorName: parseSupervisor(supervisorRaw),
      phone,
      ...parseAddress(practiceAddress),
      hasPhone: Boolean(phone),
      status: "active" as const,
    };
  });

  return { sheetName, students };
}

function buildSeedSql(sheetName: string, students: StudentRecord[]) {
  const lines = [
    "-- Auto-generated from RIAX.xlsx. Re-run: npm run seed:sql",
    `-- Source sheet: ${sheetName}; records: ${students.length}`,
    "begin;",
  ];

  const groups = [...new Set(students.map((item) => item.group).filter(Boolean))];
  const supervisors = [...new Set(students.map((item) => item.supervisorName).filter(Boolean))];
  const mahallas = [...new Map(students.filter((item) => item.mahallaName).map((item) => [`${item.region}|${item.district}|${item.mahallaName}`, item])).values()];

  for (const group of groups) {
    lines.push(`insert into public.groups (name) values (${sql(group)}) on conflict (name) do nothing;`);
  }
  for (const supervisor of supervisors) {
    lines.push(`insert into public.supervisors (full_name) values (${sql(supervisor)}) on conflict (full_name) do nothing;`);
  }
  for (const item of mahallas) {
    lines.push(`insert into public.mahallas (name, region, district, address) values (${sql(item.mahallaName)}, ${sql(item.region)}, ${sql(item.district)}, ${sql(item.practiceAddress)}) on conflict (name, region, district) do update set address = excluded.address;`);
  }

  for (const item of students) {
    const source = JSON.stringify({
      number: item.sourceRow,
      fullName: item.fullName,
      group: item.group,
      practiceAddress: item.practiceAddress,
      supervisor: item.supervisorRaw,
      phone: item.phone,
    });
    lines.push(
      `insert into public.students (source_row, full_name, phone, practice_address, group_id, supervisor_id, mahalla_id, source_record)` +
      ` select ${item.sourceRow}, ${sql(item.fullName)}, ${sql(item.phone)}, ${sql(item.practiceAddress)}, g.id, s.id, m.id, ${sql(source)}::jsonb` +
      ` from public.groups g join public.supervisors s on s.full_name = ${sql(item.supervisorName)}` +
      ` left join public.mahallas m on m.name is not distinct from ${sql(item.mahallaName)} and m.region = ${sql(item.region)}` +
      ` where g.name = ${sql(item.group)}` +
      ` on conflict (source_row) do update set full_name=excluded.full_name, phone=excluded.phone, practice_address=excluded.practice_address, group_id=excluded.group_id, supervisor_id=excluded.supervisor_id, mahalla_id=excluded.mahalla_id, source_record=excluded.source_record;`,
    );
  }
  lines.push("commit;", "");
  return lines.join("\n");
}

async function upsertSupabase(students: StudentRecord[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { skipped: true, reason: "Supabase environment variables are not configured." };

  const client = createClient(url, key, { auth: { persistSession: false } });
  const groupNames = [...new Set(students.map((item) => item.group))];
  const supervisorNames = [...new Set(students.map((item) => item.supervisorName))];
  const mahallaRows = [...new Map(students.filter((item) => item.mahallaName).map((item) => [`${item.region}|${item.district}|${item.mahallaName}`, {
    name: item.mahallaName!, region: item.region, district: item.district, address: item.practiceAddress,
  }])).values()];

  const throwIfError = (label: string, error: { message: string } | null) => {
    if (error) throw new Error(`${label}: ${error.message}`);
  };
  throwIfError("groups", (await client.from("groups").upsert(groupNames.map((name) => ({ name })), { onConflict: "name" })).error);
  throwIfError("supervisors", (await client.from("supervisors").upsert(supervisorNames.map((full_name) => ({ full_name })), { onConflict: "full_name" })).error);
  throwIfError("mahallas", (await client.from("mahallas").upsert(mahallaRows, { onConflict: "name,region,district" })).error);

  const [{ data: groups }, { data: supervisors }, { data: mahallas }] = await Promise.all([
    client.from("groups").select("id,name"),
    client.from("supervisors").select("id,full_name"),
    client.from("mahallas").select("id,name,region,district"),
  ]);
  const groupMap = new Map((groups ?? []).map((row) => [row.name, row.id]));
  const supervisorMap = new Map((supervisors ?? []).map((row) => [row.full_name, row.id]));
  const mahallaMap = new Map((mahallas ?? []).map((row) => [`${row.region}|${row.district}|${row.name}`, row.id]));

  const payload = students.map((item) => ({
    source_row: item.sourceRow,
    full_name: item.fullName,
    phone: item.phone,
    practice_address: item.practiceAddress,
    group_id: groupMap.get(item.group),
    supervisor_id: supervisorMap.get(item.supervisorName),
    mahalla_id: item.mahallaName ? mahallaMap.get(`${item.region}|${item.district}|${item.mahallaName}`) : null,
    source_record: item,
  }));
  for (let start = 0; start < payload.length; start += 100) {
    throwIfError("students", (await client.from("students").upsert(payload.slice(start, start + 100), { onConflict: "source_row" })).error);
  }
  return { skipped: false, imported: payload.length };
}

async function main() {
  const { sheetName, students } = await readWorkbook();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(path.dirname(sqlPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify({ source: "RIAX.xlsx", sheetName, generatedAt: new Date().toISOString(), students }, null, 2));
  await fs.writeFile(sqlPath, buildSeedSql(sheetName, students));
  const result = sqlOnly ? { skipped: true, reason: "--sql-only" } : await upsertSupabase(students);
  console.log(JSON.stringify({ sheetName, records: students.length, json: outputPath, sql: sqlPath, supabase: result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
