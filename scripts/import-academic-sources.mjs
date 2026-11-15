import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import XLSX from "xlsx";
import JSZip from "jszip";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, "").split("=");
  return [key, value.join("=")];
}));

const sourceDir = path.resolve(args["source-dir"] || path.join(process.cwd(), "..", "RIAX"));
const contingentFile = path.resolve(args.contingent || process.env.RIAX_CONTINGENT_PATH || path.join(sourceDir, "Bitiruvchi 2025-2026.xlsx"));
const outputFile = path.resolve(args.output || path.join(process.cwd(), "data", "imported-academic-data.json"));
const sqlFile = path.resolve(args.sql || path.join(process.cwd(), "supabase", "imports", "academic-source-data.sql"));

const sourceFiles = {
  scopus: path.join(sourceDir, "Scopus ID RIAX.xlsx"),
  internships: path.join(sourceDir, "Ri va Ax dual ta'lim.xlsx"),
  theses: path.join(sourceDir, "ВМI mavzularini biriktirish.xlsx"),
  masters: path.join(sourceDir, "Magistr bitiruvchilari.docx"),
  contingent: contingentFile,
};

for (const [name, file] of Object.entries(sourceFiles)) {
  if (!fs.existsSync(file)) throw new Error(`${name} manba fayli topilmadi: ${file}`);
}

function stableUuid(namespace, value) {
  const hex = crypto.createHash("sha256").update(`${namespace}:${value}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 3) | 8).toString(16);
  const id = hex.join("");
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeName(value) {
  return clean(value)
    .toLocaleUpperCase("uz")
    .replace(/[‘’ʻʼ`´']/g, "'")
    .replace(/[^A-ZА-ЯЁҚҒҲЎІÍ' ]/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readRows(file, sheetName) {
  const workbook = XLSX.readFile(file, { cellDates: true, raw: false });
  const name = sheetName || workbook.SheetNames[0];
  return {
    sheetName: name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null, raw: false }),
  };
}

function parseScopus() {
  const { sheetName, rows } = readRows(sourceFiles.scopus);
  const records = rows.slice(1).filter((row) => /^\d+$/.test(clean(row[0])) && clean(row[1])).map((row) => ({
    source_row: Number(clean(row[0])),
    full_name: clean(row[1]),
    scopus_author_id: /^\d+$/.test(clean(row[2])) ? clean(row[2]) : null,
    faculty_code: clean(row[3]) || null,
    department: clean(row[4]) || null,
    source_position: clean(row[5]) || null,
    scopus_profile_url: /^https?:\/\//i.test(clean(row[6])) ? clean(row[6]) : null,
  }));
  return { sheetName, records };
}

function parseInternships() {
  const { sheetName, rows } = readRows(sourceFiles.internships);
  const records = rows.slice(1).filter((row) => clean(row[1])).map((row, index) => {
    const fullName = clean(row[1]);
    const group = clean(row[2]);
    const studentId = stableUuid("student", `${normalizeName(fullName)}|${group}`);
    return {
      id: stableUuid("internship", `${normalizeName(fullName)}|${group}|${index + 1}`),
      student_id: studentId,
      student_name: fullName,
      academic_group: group || null,
      study_program: group.startsWith("RI") ? "Raqamli iqtisodiyot" : group.startsWith("AX") ? "Axborot xavfsizligi" : null,
      organization_name: clean(row[3]) || null,
      university_supervisor_name: clean(row[4]) || null,
      student_phone: clean(row[5]) || null,
      start_date: null,
      end_date: null,
      status: "source_imported",
      source_file: path.basename(sourceFiles.internships),
      source_row: index + 2,
    };
  });
  return { sheetName, records };
}

function parseTheses() {
  const { sheetName, rows } = readRows(sourceFiles.theses);
  const records = rows.slice(1).filter((row) => clean(row[1]) && clean(row[3])).map((row, index) => {
    const fullName = clean(row[1]);
    const group = clean(row[2]);
    const studentId = stableUuid("student", `${normalizeName(fullName)}|${group}`);
    return {
      id: stableUuid("thesis", `${normalizeName(fullName)}|${group}|${index + 1}`),
      student_id: studentId,
      student_name: fullName,
      academic_group: group || null,
      study_program: group.startsWith("RI") ? "Raqamli iqtisodiyot" : group.startsWith("AX") ? "Axborot xavfsizligi" : null,
      thesis_topic: clean(row[3]),
      supervisor_name: clean(row[4]) || null,
      student_phone: clean(row[5]) || null,
      topic_approval_status: "imported",
      defense_readiness: "unknown",
      progress: null,
      source_file: path.basename(sourceFiles.theses),
      source_row: index + 2,
    };
  });
  return { sheetName, records };
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlText(xml) {
  return clean(decodeXml([...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]).join(" ")));
}

async function parseMasters() {
  const zip = await JSZip.loadAsync(fs.readFileSync(sourceFiles.masters));
  const xml = await zip.file("word/document.xml").async("string");
  const tableXml = [...xml.matchAll(/<w:tbl(?:\s[^>]*)?>([\s\S]*?)<\/w:tbl>/g)].map((match) => match[1]);
  const tables = tableXml.map((table) => [...table.matchAll(/<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g)].map((row) =>
    [...row[1].matchAll(/<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g)].map((cell) => xmlText(cell[1])),
  ));
  const records = [];
  for (let tableIndex = 0; tableIndex < tables.length; tableIndex += 1) {
    const program = tableIndex === 0 ? "Elektron tijorat" : tableIndex === 1 ? "Raqamli iqtisodiyot" : "Elektron tijorat";
    for (let rowIndex = 1; rowIndex < tables[tableIndex].length; rowIndex += 1) {
      const row = tables[tableIndex][rowIndex];
      const fullName = clean(row[1]);
      if (!fullName) continue;
      const courseGroup = clean(row[2]);
      const courseMatch = courseGroup.match(/(\d+)\s*-?\s*kurs/i);
      const groupMatch = courseGroup.match(/([A-ZА-Я]{1,4}\s*-\s*\d+)/i);
      const group = clean(groupMatch?.[1] || (tableIndex === 2 ? row[2] : "")).replace(/\s+/g, "");
      const hasTopic = tableIndex === 2;
      records.push({
        id: stableUuid("master", `${normalizeName(fullName)}|${group}|${tableIndex}|${rowIndex}`),
        student_name: fullName,
        specialty: program,
        course: courseMatch ? Number(courseMatch[1]) : tableIndex === 2 ? 1 : null,
        academic_group: group || null,
        dissertation_topic: hasTopic ? clean(row[3]) || null : null,
        supervisor_name: clean(hasTopic ? row[4] : row[5]) || null,
        research_object: hasTopic ? null : clean(row[4]) || null,
        pedagogical_object: hasTopic ? null : clean(row[3]) || null,
        preparation_status: "unknown",
        defense_status: "unknown",
        progress: null,
        source_file: path.basename(sourceFiles.masters),
        source_table: tableIndex + 1,
        source_row: rowIndex + 1,
      });
    }
  }
  return { tableCount: tables.length, records };
}

function parseContingent() {
  const workbook = XLSX.readFile(sourceFiles.contingent, { raw: false });
  const records = [];
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null, raw: false });
    rows.slice(3).forEach((row, index) => {
      const fullName = clean(row[1]);
      if (!fullName) return;
      records.push({
        id: stableUuid("contingent", `${sheetName}|${normalizeName(fullName)}|${clean(row[0])}`),
        source_number: clean(row[0]) || null,
        student_name: fullName,
        study_program: clean(row[2]) || null,
        study_form: clean(row[3]) || null,
        faculty: clean(row[4]) || null,
        region: clean(row[5]) || null,
        district: clean(row[6]) || null,
        student_phone: clean(row[7]) || null,
        department: clean(row[8]) || null,
        assigned_faculty_name: clean(row[9]) || null,
        employment_status: clean(row[11]) || null,
        source_sheet: sheetName,
        source_row: index + 4,
      });
    });
  }
  return { sheetNames: workbook.SheetNames, records };
}

function buildAttestationCandidates(contingent, theses) {
  const thesisMatches = new Map();
  for (const thesis of theses) {
    const key = normalizeName(thesis.student_name);
    thesisMatches.set(key, (thesisMatches.get(key) || 0) + 1);
  }
  const contingentMatches = new Map();
  for (const student of contingent) {
    const key = normalizeName(student.student_name);
    contingentMatches.set(key, (contingentMatches.get(key) || 0) + 1);
  }
  return contingent
    .filter((student) => !thesisMatches.has(normalizeName(student.student_name)))
    .map((student) => {
      const key = normalizeName(student.student_name);
      return {
        id: stableUuid("attestation-candidate", `${student.id}`),
        student_id: student.id,
        student_name: student.student_name,
        academic_group: null,
        study_program: student.study_program,
        status: "pending_review",
        match_status: contingentMatches.get(key) > 1 ? "ambiguous_name" : "not_in_thesis_source",
        needs_admin_review: true,
        source_file: path.basename(sourceFiles.contingent),
      };
    });
}

function sqlValue(value) {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function makeSql(data) {
  const lines = [
    "-- Generated from supplied academic source files. Missing values remain NULL.",
    "-- Apply migrations before this import. Re-running is safe because source UUIDs are stable.",
    "begin;",
  ];
  for (const row of data.students) {
    lines.push(`insert into public.students (id,full_name,status,source_record) values (${[row.id,row.full_name,"active"].map(sqlValue).join(",")},${sqlValue(JSON.stringify(row.source_record))}::jsonb) on conflict (id) do update set full_name=excluded.full_name,source_record=public.students.source_record||excluded.source_record,updated_at=now();`);
  }
  for (const row of data.internship_assignments) {
    lines.push(`insert into public.internship_assignments (id,student_id,student_name,academic_group,study_program,organization_name,university_supervisor_name,student_phone,start_date,end_date,status,source_file,source_row) values (${[row.id,row.student_id,row.student_name,row.academic_group,row.study_program,row.organization_name,row.university_supervisor_name,row.student_phone,row.start_date,row.end_date,row.status,row.source_file,row.source_row].map(sqlValue).join(",")}) on conflict (id) do update set student_name=excluded.student_name,academic_group=excluded.academic_group,organization_name=excluded.organization_name,university_supervisor_name=excluded.university_supervisor_name,student_phone=excluded.student_phone,updated_at=now();`);
  }
  for (const row of data.graduation_theses) {
    lines.push(`insert into public.graduation_theses (id,student_id,student_name,academic_group,study_program,thesis_topic,supervisor_name,student_phone,topic_approval_status,defense_readiness,progress,source_file,source_row) values (${[row.id,row.student_id,row.student_name,row.academic_group,row.study_program,row.thesis_topic,row.supervisor_name,row.student_phone,row.topic_approval_status,row.defense_readiness,row.progress,row.source_file,row.source_row].map(sqlValue).join(",")}) on conflict (id) do update set student_name=excluded.student_name,academic_group=excluded.academic_group,thesis_topic=excluded.thesis_topic,supervisor_name=excluded.supervisor_name,student_phone=excluded.student_phone,updated_at=now();`);
  }
  for (const row of data.master_dissertations) {
    lines.push(`insert into public.master_dissertations (id,student_name,specialty,course,academic_group,dissertation_topic,supervisor_name,research_object,pedagogical_object,preparation_status,defense_status,progress,source_file,source_table,source_row) values (${[row.id,row.student_name,row.specialty,row.course,row.academic_group,row.dissertation_topic,row.supervisor_name,row.research_object,row.pedagogical_object,row.preparation_status,row.defense_status,row.progress,row.source_file,row.source_table,row.source_row].map(sqlValue).join(",")}) on conflict (id) do update set student_name=excluded.student_name,specialty=excluded.specialty,course=excluded.course,academic_group=excluded.academic_group,dissertation_topic=excluded.dissertation_topic,supervisor_name=excluded.supervisor_name,research_object=excluded.research_object,pedagogical_object=excluded.pedagogical_object,updated_at=now();`);
  }
  for (const row of data.attestation_candidates) {
    lines.push(`insert into public.attestation_candidates (id,student_id,student_name,academic_group,study_program,status,match_status,needs_admin_review,source_file) values (${[row.id,row.student_id,row.student_name,row.academic_group,row.study_program,row.status,row.match_status,row.needs_admin_review,row.source_file].map(sqlValue).join(",")}) on conflict (id) do update set status=excluded.status,match_status=excluded.match_status,needs_admin_review=excluded.needs_admin_review,updated_at=now();`);
  }
  lines.push("commit;", "");
  return lines.join("\n");
}

const scopus = parseScopus();
const internships = parseInternships();
const theses = parseTheses();
const masters = await parseMasters();
const contingent = parseContingent();
const attestationCandidates = buildAttestationCandidates(contingent.records, theses.records);
const studentMap = new Map();
for (const row of [...internships.records, ...theses.records]) {
  if (!studentMap.has(row.student_id)) studentMap.set(row.student_id, { id: row.student_id, full_name: row.student_name, source_record: { academic_group: row.academic_group, study_program: row.study_program } });
}
const students = [...studentMap.values()];
const thesisNames = new Set(theses.records.map((row) => normalizeName(row.student_name)));
const contingentMatchCount = contingent.records.filter((row) => thesisNames.has(normalizeName(row.student_name))).length;
const attestationComplete = contingentMatchCount > 0 && contingent.records.every((row) => row.academic_group || row.student_id);

const data = {
  generated_at: new Date().toISOString(),
  sources: Object.fromEntries(Object.entries(sourceFiles).map(([key, value]) => [key, path.basename(value)])),
  summary: {
    scopus_faculty: scopus.records.length,
    internship_assignments: internships.records.length,
    graduation_theses: theses.records.length,
    master_dissertations: masters.records.length,
    fourth_year_contingent: contingent.records.length,
    attestation_candidates: attestationCandidates.length,
    students: students.length,
    contingent_thesis_matches: contingentMatchCount,
    attestation_complete: attestationComplete,
    attestation_note: attestationComplete
      ? "Kontingent va BMI manbalari talaba identifikatori yoki guruh bilan tekshirildi."
      : "Kontingent va BMI manbalarida umumiy talaba ID/guruh yo‘q yoki aniq moslik topilmadi; YADK nomzodlari to‘liq ro‘yxat deb belgilanmadi va admin tasdig‘ini talab qiladi.",
  },
  source_metadata: {
    scopus_sheet: scopus.sheetName,
    internships_sheet: internships.sheetName,
    theses_sheet: theses.sheetName,
    masters_tables: masters.tableCount,
    contingent_sheets: contingent.sheetNames,
  },
  scopus_faculty: scopus.records,
  students,
  internship_assignments: internships.records,
  graduation_theses: theses.records,
  master_dissertations: masters.records,
  fourth_year_contingent: contingent.records,
  attestation_candidates: attestationCandidates,
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.mkdirSync(path.dirname(sqlFile), { recursive: true });
fs.writeFileSync(sqlFile, makeSql(data), "utf8");
console.log(JSON.stringify({ outputFile, sqlFile, summary: data.summary }, null, 2));
