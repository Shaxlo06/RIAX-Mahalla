"use client";

import { useMemo, useState } from "react";
import { Archive, Download, FileText, FolderArchive } from "lucide-react";
import { useRole } from "@/components/auth/role-context";
import { PageHeader } from "@/components/ui/page-header";
import { useSmartCollection } from "@/lib/smart-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SmartRecord } from "@/types/smart-domain";

type PortfolioData = {
  faculty: SmartRecord;
  assignments: SmartRecord[];
  subjects: SmartRecord[];
  materials: SmartRecord[];
  lessons: SmartRecord[];
  usage: SmartRecord[];
  certificates: SmartRecord[];
  development: SmartRecord[];
};

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = fileName; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(value: unknown) { return String(value || "portfolio").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, ""); }
function text(value: unknown) { return String(value ?? "—").replace(/[‘’]/g, "'").replace(/[–—]/g, "-"); }

export function TeachingPortfolio() {
  const { canManage } = useRole();
  const faculty = useSmartCollection<SmartRecord>("faculty_profiles");
  const assignments = useSmartCollection<SmartRecord>("subject_assignments");
  const subjects = useSmartCollection<SmartRecord>("subjects");
  const materials = useSmartCollection<SmartRecord>("educational_materials");
  const lessons = useSmartCollection<SmartRecord>("lessons");
  const usage = useSmartCollection<SmartRecord>("lesson_content_usage");
  const certificates = useSmartCollection<SmartRecord>("faculty_certificates");
  const development = useSmartCollection<SmartRecord>("professional_development");
  const [facultyId, setFacultyId] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo<PortfolioData | null>(() => {
    const member = faculty.rows.find((row) => row.id === facultyId);
    if (!member) return null;
    const ownAssignments = assignments.rows.filter((row) => row.faculty_id === facultyId);
    const subjectIds = new Set(ownAssignments.map((row) => String(row.subject_id)));
    const ownMaterials = materials.rows.filter((row) => row.faculty_id === facultyId);
    const ownLessons = lessons.rows.filter((row) => row.faculty_id === facultyId);
    const lessonIds = new Set(ownLessons.map((row) => row.id));
    return { faculty: member, assignments: ownAssignments, subjects: subjects.rows.filter((row) => subjectIds.has(row.id)), materials: ownMaterials, lessons: ownLessons, usage: usage.rows.filter((row) => lessonIds.has(String(row.lesson_id))), certificates: certificates.rows.filter((row) => row.faculty_id === facultyId), development: development.rows.filter((row) => row.faculty_id === facultyId) };
  }, [assignments.rows, certificates.rows, development.rows, faculty.rows, facultyId, lessons.rows, materials.rows, subjects.rows, usage.rows]);

  async function downloadPdf() {
    if (!selected) return;
    setWorking(true); setMessage("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const navy = rgb(0.03, 0.13, 0.34); const gold = rgb(0.95, 0.68, 0.03);
      let page = pdf.addPage([595, 842]); let y = 790;
      const addPage = () => { page = pdf.addPage([595, 842]); y = 790; };
      const line = (value: string, options: { size?: number; weight?: "bold"; color?: typeof navy; gap?: number } = {}) => {
        const size = options.size || 10; const font = options.weight === "bold" ? bold : regular; const max = 88;
        const words = text(value).split(/\s+/); const parts: string[] = []; let current = "";
        for (const word of words) { const next = `${current} ${word}`.trim(); if (next.length > max && current) { parts.push(current); current = word; } else current = next; }
        if (current) parts.push(current);
        for (const part of parts) { if (y < 55) addPage(); page.drawText(part, { x: 45, y, size, font, color: options.color || navy }); y -= options.gap || size + 5; }
      };
      page.drawRectangle({ x: 0, y: 752, width: 595, height: 90, color: navy });
      page.drawRectangle({ x: 0, y: 746, width: 595, height: 6, color: gold });
      page.drawText("SMART", { x: 45, y: 793, size: 24, font: bold, color: rgb(1, 1, 1) });
      page.drawText("RIAX", { x: 145, y: 793, size: 24, font: bold, color: gold });
      page.drawText("Professor-o'qituvchi o'quv portfoliysi", { x: 45, y: 770, size: 11, font: regular, color: rgb(0.88, 0.92, 1) });
      y = 715;
      line(text(selected.faculty.full_name), { size: 20, weight: "bold", gap: 28 });
      line(`${text(selected.faculty.position)} | ${text(selected.faculty.academic_degree)} | ${text(selected.faculty.academic_title)}`);
      line(`Kafedra: ${text(selected.faculty.department)}`, { gap: 24 });
      const sections: [string, SmartRecord[], (row: SmartRecord) => string][] = [
        ["Biriktirilgan fanlar", selected.subjects, (row) => `${text(row.code)} - ${text(row.name)} (${text(row.academic_year)})`],
        ["O'quv materiallari", selected.materials, (row) => `${text(row.topic)} | ${text(row.content_type)} | v${text(row.current_version)} | ${text(row.approval_status)}`],
        ["Dars faoliyati", selected.lessons, (row) => `${text(row.lesson_date)} | ${text(row.academic_group)} | ${text(row.topic)}`],
        ["Tasdiqlangan foydalanish dalillari", selected.usage.filter((row) => ["platform_opened","platform_presented","supervisor_verified"].includes(String(row.usage_type))), (row) => `${text(row.usage_type)} | ${text(row.observed_at)}`],
        ["Sertifikatlar", selected.certificates, (row) => `${text(row.certificate_name)} | ${text(row.issuing_organization)} | ${text(row.verification_status)}`],
        ["Malaka oshirish", selected.development, (row) => `${text(row.activity_name)} | ${text(row.completed_at)} | keyingi muddat: ${text(row.next_required_date)}`],
      ];
      for (const [heading, rows, formatter] of sections) {
        line(heading, { size: 14, weight: "bold", color: navy, gap: 22 });
        if (rows.length === 0) line("Ma'lumot mavjud emas.", { gap: 20 });
        else rows.forEach((row, index) => line(`${index + 1}. ${formatter(row)}`));
        y -= 8;
      }
      const bytes = await pdf.save();
      saveBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), `${safeName(selected.faculty.full_name)}-portfolio.pdf`);
      setMessage("PDF portfolio tayyorlandi.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "PDF yaratishda xatolik."); }
    finally { setWorking(false); }
  }

  async function downloadZip() {
    if (!selected) return;
    setWorking(true); setMessage("");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      zip.file("portfolio-ma'lumotlari.json", JSON.stringify(selected, null, 2));
      let attached = 0;
      if (isSupabaseConfigured()) {
        const candidates = [...selected.materials, ...selected.certificates].filter((row) => row.storage_path);
        for (const row of candidates) {
          const { data } = await createClient().storage.from("smart-riax-documents").createSignedUrl(String(row.storage_path), 90);
          if (!data?.signedUrl) continue;
          const response = await fetch(data.signedUrl);
          if (response.ok) { zip.file(`hujjatlar/${safeName(row.file_name || row.id)}`, await response.arrayBuffer()); attached += 1; }
        }
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      saveBlob(blob, `${safeName(selected.faculty.full_name)}-portfolio.zip`);
      setMessage(isSupabaseConfigured() ? `ZIP tayyorlandi: ${attached} ta ruxsatli fayl qo‘shildi.` : "Demo rejimida ZIP metadata bilan tayyorlandi; haqiqiy fayllar Supabase Storage ulanganda qo‘shiladi.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "ZIP yaratishda xatolik."); }
    finally { setWorking(false); }
  }

  return <div className="animate-enter"><PageHeader eyebrow="Avtomatik eksport" title="Portfolioni yuklab olish" description="Bazadagi tasdiqlangan profil, fan, material, dars faolligi va malaka oshirish yozuvlaridan professional portfolio yarating." icon={FolderArchive}/><section className="panel rounded-[26px] p-5 sm:p-6"><label className="block text-sm font-black text-[#18284a]">Professor-o‘qituvchini tanlang<select value={facultyId} onChange={(event)=>setFacultyId(event.target.value)} className="input mt-2"><option value="">Tanlang</option>{faculty.rows.filter((row)=>row.is_active!==false).map((row)=><option key={row.id} value={row.id}>{String(row.full_name||row.id)}</option>)}</select></label>{faculty.rows.length===0&&<p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Portfolio yaratish uchun avval professor-o‘qituvchi profilini kiriting.</p>}{selected&&<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Fanlar",selected.subjects.length],["Materiallar",selected.materials.length],["Darslar",selected.lessons.length],["Sertifikatlar",selected.certificates.length]].map(([label,value])=><div key={String(label)} className="rounded-2xl bg-[#f3f7fc] p-4"><span className="text-xs font-bold text-[#6d7990]">{label}</span><b className="font-display mt-1 block text-3xl text-[#08265f]">{value}</b></div>)}</div>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><button disabled={!selected||working} onClick={downloadPdf} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08265f] px-5 text-sm font-black text-white disabled:opacity-40"><FileText size={18}/><Download size={16}/>PDF portfolio</button><button disabled={!selected||working||!canManage("teaching")} onClick={downloadZip} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f2b705] px-5 text-sm font-black text-[#061b4f] disabled:opacity-40"><Archive size={18}/>Hujjatlar ZIP</button></div>{message&&<p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-800">{message}</p>}</section></div>;
}
