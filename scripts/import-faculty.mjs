import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
const root = process.cwd();
const sourceFile = process.env.RIAX_SCOPUS_EXCEL_PATH || path.resolve(root, "..", "RIAX", "Scopus ID RIAX.xlsx");
const excelPath = path.resolve(root, sourceFile);
const outputPath = path.resolve(root, "data/faculty-profiles.json");
const sqlPath = path.resolve(root, "supabase/faculty-seed.sql");
const sqlOnly = process.argv.includes("--sql-only");
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const sql = (value) => value === null || value === undefined ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const nameKey = (value) => clean(value).toLocaleLowerCase("uz").replace(/[‘’`ʻ]/g, "'");
function deterministicId(sourceRow) {
    return `00000000-0000-4000-8000-${String(sourceRow).padStart(12, "0")}`;
}
function parsePosition(raw) {
    const lower = raw.toLocaleLowerCase("uz");
    let academicDegree = null;
    if (/f-m\.f\.d/.test(lower))
        academicDegree = "Fizika-matematika fanlari doktori";
    else if (/i\.f\.f\.d/.test(lower))
        academicDegree = "Iqtisodiyot fanlari bo‘yicha falsafa doktori (PhD)";
    else if (/i\.f\.d/.test(lower))
        academicDegree = "Iqtisodiyot fanlari doktori";
    else if (/i\.f\.n/.test(lower))
        academicDegree = "Iqtisodiyot fanlari nomzodi";
    let position = "Professor-o‘qituvchi";
    let academicTitle = null;
    if (/kaf\.\s*mudiri/.test(lower))
        position = "Kafedra mudiri";
    else if (/prof\.v\.b/.test(lower))
        position = "Professor v.b.";
    else if (/prof\./.test(lower))
        position = "Professor";
    else if (/dots(?:ent)?\s*v\.b/.test(lower))
        position = "Dotsent v.b.";
    else if (/dotsent|dots\b/.test(lower))
        position = "Dotsent";
    else if (/katta o‘qituvchi/.test(lower))
        position = "Katta o‘qituvchi";
    else if (/assistent/.test(lower))
        position = "Assistent";
    if (/prof/.test(lower))
        academicTitle = "Professor";
    else if (/dots/.test(lower))
        academicTitle = "Dotsent";
    return { academicDegree, academicTitle, position };
}
function parseScopus(idValue, linkValue) {
    const rawId = clean(idValue);
    const rawLink = clean(linkValue);
    const id = /^\d{8,15}$/.test(rawId) ? rawId : null;
    const link = /^https?:\/\//i.test(rawLink) ? rawLink : null;
    const linkId = link?.match(/[?&]authorId=(\d{8,15})/i)?.[1] || null;
    if (!id)
        return { id: null, link, status: "missing", note: "Scopus profili manba faylida mavjud emas." };
    if (!linkId || linkId !== id)
        return { id, link, status: "conflict", note: `Manbadagi Scopus ID (${id}) va profil havolasidagi Author ID (${linkId || "topilmadi"}) mos emas.` };
    return { id, link, status: "source_matched", note: "Scopus ID manba faylidagi profil havolasi bilan mos." };
}
async function readSource() {
    const workbook = XLSX.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName)
        throw new Error("Excel faylida varaq topilmadi.");
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
    const faculty = rows.flatMap((row) => {
        const sourceRow = Number(row["№"]);
        const fullName = clean(row["F.I.Sh."]);
        if (!Number.isInteger(sourceRow) || sourceRow <= 0 || !fullName)
            return [];
        const sourcePosition = clean(row.Lavozim);
        const parsedPosition = parsePosition(sourcePosition);
        const scopus = parseScopus(row["Scopus ID"], row["Scopus profil linki"]);
        return [{
                id: deterministicId(sourceRow), source_row: sourceRow, full_name: fullName,
                academic_degree: parsedPosition.academicDegree, academic_title: parsedPosition.academicTitle,
                position: parsedPosition.position, employment_status: "active",
                department: clean(row.Kafedra) || "Raqamli iqtisodiyot va axborot xavfsizligi",
                faculty_code: clean(row.Fakultet) || null, source_position: sourcePosition,
                teaching_subjects: [], professional_qualifications: sourcePosition ? [sourcePosition] : [],
                scopus_author_id: scopus.id, scopus_profile_url: scopus.link,
                scopus_status: scopus.status, scopus_verification_note: scopus.note,
                source_file: path.basename(excelPath), is_active: true,
            }];
    });
    return { sheetName, faculty };
}
function buildSql(sheetName, faculty) {
    const lines = [
        "-- Auto-generated from Scopus ID RIAX.xlsx. Re-run: npm run import:faculty -- --sql-only",
        `-- Source sheet: ${sheetName}; faculty records: ${faculty.length}`,
        "begin;",
    ];
    for (const item of faculty) {
        const qualifications = JSON.stringify(item.professional_qualifications);
        const values = `${sql(item.id)}::uuid,${item.source_row},${sql(item.full_name)},${sql(item.academic_degree)},${sql(item.academic_title)},${sql(item.position)},${sql(item.employment_status)},${sql(item.department)},${sql(item.faculty_code)},${sql(item.source_position)},${sql(qualifications)}::jsonb,${sql(item.scopus_author_id)},${sql(item.scopus_profile_url)},${sql(item.scopus_status)},${sql(item.scopus_verification_note)},${sql(item.source_file)},true`;
        lines.push(`update public.faculty_profiles set source_row=${item.source_row},full_name=${sql(item.full_name)},academic_degree=${sql(item.academic_degree)},academic_title=${sql(item.academic_title)},position=${sql(item.position)},employment_status='active',department=${sql(item.department)},faculty_code=${sql(item.faculty_code)},source_position=${sql(item.source_position)},professional_qualifications=${sql(qualifications)}::jsonb,scopus_author_id=${sql(item.scopus_author_id)},scopus_profile_url=${sql(item.scopus_profile_url)},scopus_status=${sql(item.scopus_status)},scopus_verification_note=${sql(item.scopus_verification_note)},source_file=${sql(item.source_file)},is_active=true,updated_at=now() where source_row=${item.source_row} or lower(trim(full_name))=${sql(clean(item.full_name).toLocaleLowerCase("uz"))};`, `insert into public.faculty_profiles (id,source_row,full_name,academic_degree,academic_title,position,employment_status,department,faculty_code,source_position,professional_qualifications,scopus_author_id,scopus_profile_url,scopus_status,scopus_verification_note,source_file,is_active) select ${values} where not exists (select 1 from public.faculty_profiles where source_row=${item.source_row} or lower(trim(full_name))=${sql(clean(item.full_name).toLocaleLowerCase("uz"))}) on conflict (id) do update set source_row=excluded.source_row,full_name=excluded.full_name,academic_degree=excluded.academic_degree,academic_title=excluded.academic_title,position=excluded.position,employment_status=excluded.employment_status,department=excluded.department,faculty_code=excluded.faculty_code,source_position=excluded.source_position,professional_qualifications=excluded.professional_qualifications,scopus_author_id=excluded.scopus_author_id,scopus_profile_url=excluded.scopus_profile_url,scopus_status=excluded.scopus_status,scopus_verification_note=excluded.scopus_verification_note,source_file=excluded.source_file,is_active=excluded.is_active,updated_at=now();`);
    }
    lines.push("commit;", "");
    return lines.join("\n");
}
async function upsertSupabase(faculty) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
        return { skipped: true, reason: "Supabase environment variables are not configured." };
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data: existing, error: readError } = await client.from("faculty_profiles").select("id,full_name,source_row");
    if (readError)
        throw new Error(`faculty_profiles read: ${readError.message}`);
    const existingByName = new Map((existing || []).map((row) => [nameKey(row.full_name), row.id]));
    const existingBySource = new Map((existing || []).filter((row) => row.source_row).map((row) => [Number(row.source_row), row.id]));
    let updated = 0;
    let inserted = 0;
    for (const item of faculty) {
        const existingId = existingBySource.get(item.source_row) || existingByName.get(nameKey(item.full_name));
        const payload = { ...item, id: existingId || item.id };
        const { error } = await client.from("faculty_profiles").upsert(payload, { onConflict: "id" });
        if (error)
            throw new Error(`faculty_profiles ${item.full_name}: ${error.message}`);
        if (existingId)
            updated += 1;
        else
            inserted += 1;
    }
    return { skipped: false, inserted, updated };
}
async function main() {
    const { sheetName, faculty } = await readSource();
    const matched = faculty.filter((item) => item.scopus_status === "source_matched").length;
    const missing = faculty.filter((item) => item.scopus_status === "missing").length;
    const conflicts = faculty.filter((item) => item.scopus_status === "conflict").length;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.mkdir(path.dirname(sqlPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify({ source: path.basename(excelPath), sheetName, generatedAt: new Date().toISOString(), summary: { total: faculty.length, matched, missing, conflicts }, faculty }, null, 2));
    await fs.writeFile(sqlPath, buildSql(sheetName, faculty));
    const supabase = sqlOnly ? { skipped: true, reason: "--sql-only" } : await upsertSupabase(faculty);
    console.log(JSON.stringify({ source: excelPath, sheetName, records: faculty.length, matched, missing, conflicts, json: outputPath, sql: sqlPath, supabase }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
