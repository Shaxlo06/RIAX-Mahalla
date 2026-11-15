import type { SmartField } from "@/types/smart-domain";

export const yesNo = [{label:"Ha",value:"true"},{label:"Yo‘q",value:"false"}];
export const verificationOptions = [{label:"Tekshirilmagan",value:"unverified"},{label:"Import qilingan",value:"imported"},{label:"Tasdiqlangan",value:"verified"},{label:"Rad etilgan",value:"rejected"}];
export const approvalOptions = [{label:"Qoralama",value:"draft"},{label:"Yuborilgan",value:"submitted"},{label:"Tasdiqlangan",value:"approved"},{label:"Tuzatish kerak",value:"revision_required"},{label:"Rad etilgan",value:"rejected"}];

export const facultyFields:SmartField[]=[
  {key:"full_name",label:"F.I.Sh.",required:true},{key:"academic_degree",label:"Ilmiy daraja"},{key:"academic_title",label:"Ilmiy unvon"},{key:"position",label:"Lavozim",required:true},
  {key:"employment_status",label:"Bandlik holati",type:"select",required:true,options:[{label:"Faol",value:"active"},{label:"O‘rindosh",value:"part_time"},{label:"Ta’tilda",value:"leave"},{label:"Nofaol",value:"inactive"}]},
  {key:"department",label:"Kafedra",required:true},{key:"employment_start_date",label:"Ish boshlagan sana",type:"date"},{key:"teaching_subjects",label:"O‘qitadigan fanlar",placeholder:"Vergul bilan ajrating"},
  {key:"contact_email",label:"Email",type:"email",restricted:true},{key:"contact_phone",label:"Telefon",restricted:true},{key:"professional_qualifications",label:"Kasbiy malakalar",type:"textarea"},
  {key:"faculty_code",label:"Fakultet kodi"},{key:"source_position",label:"Manbadagi lavozim"},{key:"scopus_author_id",label:"Scopus Author ID"},{key:"scopus_profile_url",label:"Scopus profil havolasi",type:"url"},{key:"scopus_status",label:"Scopus holati",type:"select",options:[{label:"ID va havola mos",value:"source_matched"},{label:"Profil mavjud emas",value:"missing"},{label:"ID va havola mos emas",value:"conflict"}]},{key:"scopus_verification_note",label:"Scopus tekshiruv izohi",type:"textarea"},{key:"wos_researcher_id",label:"WoS ResearcherID"},{key:"orcid",label:"ORCID"},{key:"is_active",label:"Faol xodim",type:"checkbox"}
];

export const certificateFields:SmartField[]=[
  {key:"faculty_id",label:"Professor-o‘qituvchi ID",required:true},{key:"certificate_name",label:"Sertifikat nomi",required:true},{key:"issuing_organization",label:"Bergan tashkilot",required:true},{key:"certificate_number",label:"Sertifikat raqami"},
  {key:"issue_date",label:"Berilgan sana",type:"date",required:true},{key:"expiration_date",label:"Amal qilish muddati",type:"date"},{key:"verification_status",label:"Tekshiruv holati",type:"select",options:[{label:"Kutilmoqda",value:"pending"},{label:"Tasdiqlangan",value:"verified"},{label:"Rad etilgan",value:"rejected"},{label:"Muddati tugagan",value:"expired"}]},{key:"file_name",label:"Sertifikat fayli",type:"file"}
];

export const developmentFields:SmartField[]=[
  {key:"faculty_id",label:"Professor-o‘qituvchi ID",required:true},{key:"activity_name",label:"Malaka oshirish faoliyati",required:true},{key:"provider",label:"Tashkilot"},{key:"started_at",label:"Boshlangan sana",type:"date"},{key:"completed_at",label:"Yakunlangan sana",type:"date"},{key:"next_required_date",label:"Keyingi muddat",type:"date"},{key:"validity_months",label:"Amal qilish muddati (oy)",type:"number"},{key:"status",label:"Holat",type:"select",options:[{label:"Rejalashtirilgan",value:"planned"},{label:"Jarayonda",value:"in_progress"},{label:"Yakunlangan",value:"completed"},{label:"Muddati o‘tgan",value:"overdue"},{label:"Bekor qilingan",value:"cancelled"}]},{key:"notes",label:"Izoh",type:"textarea"}
];

export const publicationFields:SmartField[]=[
  {key:"title",label:"Maqola nomi",required:true},{key:"authors",label:"Mualliflar",required:true},{key:"journal_or_conference",label:"Jurnal yoki konferensiya",required:true},{key:"publication_year",label:"Nashr yili",type:"number",required:true},{key:"doi",label:"DOI"},{key:"issn",label:"ISSN"},{key:"is_scopus_indexed",label:"Scopus",type:"checkbox"},{key:"is_wos_indexed",label:"Web of Science",type:"checkbox"},{key:"journal_quartile",label:"Kvartil",type:"select",options:[{label:"Q1",value:"Q1"},{label:"Q2",value:"Q2"},{label:"Q3",value:"Q3"},{label:"Q4",value:"Q4"}]},{key:"publication_url",label:"Nashr havolasi",type:"url"},{key:"source",label:"Manba",type:"select",options:[{label:"Qo‘lda",value:"manual"},{label:"Excel import",value:"excel_import"},{label:"CSV import",value:"csv_import"},{label:"Crossref",value:"crossref"},{label:"Scopus API",value:"scopus_api"},{label:"WoS API",value:"wos_api"}]},{key:"verification_status",label:"Tasdiqlash holati",type:"select",options:verificationOptions},{key:"citations",label:"Iqtiboslar",type:"number"},{key:"file_name",label:"Nashr fayli",type:"file"}
];

export const subjectFields:SmartField[]=[
  {key:"code",label:"Fan kodi"},{key:"name",label:"Fan nomi",required:true},{key:"academic_year",label:"O‘quv yili",required:true},{key:"semester",label:"Semestr",type:"number"},{key:"credits",label:"Kredit",type:"number"},{key:"is_active",label:"Faol fan",type:"checkbox"},{key:"file_name",label:"Sillabus",type:"file"}
];

export const materialFields:SmartField[]=[
  {key:"faculty_id",label:"Professor-o‘qituvchi ID",required:true},{key:"subject_id",label:"Fan ID",required:true},{key:"topic",label:"Mavzu",required:true},{key:"content_type",label:"Kontent turi",type:"select",required:true,options:[{label:"Taqdimot",value:"presentation"},{label:"Ma’ruza matni",value:"lecture_note"},{label:"Amaliy material",value:"practice"},{label:"Seminar",value:"seminar"},{label:"Laboratoriya",value:"laboratory"},{label:"Sillabus",value:"syllabus"},{label:"Ishchi dastur",value:"curriculum"},{label:"Qo‘llanma",value:"manual"},{label:"Video",value:"video"},{label:"Boshqa",value:"other"}]},{key:"academic_year",label:"O‘quv yili",required:true},{key:"current_version",label:"Versiya",required:true},{key:"approval_status",label:"Tasdiqlash holati",type:"select",options:approvalOptions},{key:"ai_assistance_declared",label:"AI yordami deklaratsiya qilingan",type:"checkbox"},{key:"file_name",label:"Material fayli",type:"file"}
];

export const lessonFields:SmartField[]=[
  {key:"subject_id",label:"Fan ID",required:true},{key:"faculty_id",label:"Professor-o‘qituvchi ID",required:true},{key:"lesson_date",label:"Dars sanasi",type:"date",required:true},{key:"academic_group",label:"Akademik guruh",required:true},{key:"topic",label:"Mavzu",required:true},{key:"lesson_type",label:"Dars turi",type:"select",options:[{label:"Ma’ruza",value:"lecture"},{label:"Amaliy",value:"practice"},{label:"Seminar",value:"seminar"},{label:"Laboratoriya",value:"laboratory"}]}
];

export const usageFields:SmartField[]=[
  {key:"lesson_id",label:"Dars ID",required:true},{key:"material_id",label:"Material ID",required:true},{key:"usage_type",label:"Foydalanish dalili",type:"select",required:true,options:[{label:"Platformada ochilgan",value:"platform_opened"},{label:"Platformada namoyish etilgan",value:"platform_presented"},{label:"O‘qituvchi bildirgan",value:"self_reported"},{label:"Rahbar tasdiqlagan",value:"supervisor_verified"}]},{key:"observed_at",label:"Qayd etilgan vaqt",type:"date"},{key:"evidence",label:"Dalil izohi",type:"textarea"}
];

export const qualityFields:SmartField[]=[
  {key:"material_id",label:"Material ID",required:true},{key:"syllabus_compliance",label:"Sillabusga moslik (%)",type:"number"},{key:"topic_alignment",label:"Mavzuga moslik (%)",type:"number"},{key:"completeness",label:"To‘liqlik (%)",type:"number"},{key:"relevance",label:"Dolzarblik (%)",type:"number"},{key:"structure_clarity",label:"Tuzilishi va ravshanligi (%)",type:"number"},{key:"current_references",label:"Manbalar yangiligi (%)",type:"number"},{key:"checklist",label:"Talablar cheklisti",type:"textarea",placeholder:"JSON yoki izoh: talab, dalil, holat"},{key:"overall_score",label:"Umumiy baho (%)",type:"number"},{key:"status",label:"Holat",type:"select",options:[{label:"Qoralama",value:"draft"},{label:"Yakunlangan",value:"completed"},{label:"Tuzatish kerak",value:"revision_required"},{label:"Tasdiqlangan",value:"approved"}]},{key:"comments",label:"Taqriz va izoh",type:"textarea"},{key:"corrective_action_status",label:"Tuzatish holati",type:"select",options:[{label:"Talab qilinmaydi",value:"not_required"},{label:"Talab qilinadi",value:"required"},{label:"Jarayonda",value:"in_progress"},{label:"Yakunlangan",value:"completed"}]}
];

export const aiFields:SmartField[]=[
  {key:"material_id",label:"Material ID",required:true},{key:"faculty_id",label:"Professor-o‘qituvchi ID",required:true},{key:"ai_tool_category",label:"AI vositasi toifasi",required:true},{key:"purpose",label:"Foydalanish maqsadi",type:"textarea",required:true},{key:"human_review_confirmed",label:"Inson tekshiruvi tasdiqlangan",type:"checkbox"},{key:"automated_indicator",label:"Avtomatik indikator (%)",type:"number"},{key:"review_status",label:"Ko‘rib chiqish holati",type:"select",options:[{label:"Deklaratsiya qilingan",value:"declared"},{label:"Inson tekshiruvi kerak",value:"human_review_required"},{label:"Ko‘rib chiqilgan",value:"reviewed"}]},{key:"reviewer_comments",label:"Tekshiruvchi izohi",type:"textarea"}
];

export const internshipFields:SmartField[]=[
  {key:"student_id",label:"Talaba ID",required:true},{key:"student_name",label:"Talaba F.I.Sh.",required:true},{key:"academic_group",label:"Akademik guruh",required:true},{key:"organization_name",label:"Amaliyot tashkiloti",required:true},{key:"university_supervisor_name",label:"Universitet rahbari"},{key:"organization_supervisor",label:"Tashkilot rahbari"},{key:"start_date",label:"Boshlanish",type:"date",required:true},{key:"end_date",label:"Yakun",type:"date",required:true},{key:"individual_plan",label:"Individual ish rejasi",type:"textarea"},{key:"progress",label:"Progress (%)",type:"number"},{key:"status",label:"Holat",type:"select",options:[{label:"Reja",value:"planned"},{label:"Faol",value:"active"},{label:"Yakunlangan",value:"completed"},{label:"Bekor qilingan",value:"cancelled"}]},{key:"assessment_result",label:"Baholash natijasi"}
];

export const thesisFields:SmartField[]=[
  {key:"student_id",label:"Talaba ID",required:true},{key:"student_name",label:"Talaba F.I.Sh.",required:true},{key:"thesis_topic",label:"BMI mavzusi",required:true},{key:"supervisor_name",label:"Ilmiy rahbar"},{key:"topic_approval_status",label:"Mavzu holati",type:"select",options:[{label:"Kutilmoqda",value:"pending"},{label:"Tasdiqlangan",value:"approved"},{label:"Rad etilgan",value:"rejected"},{label:"Tuzatish kerak",value:"revision_required"}]},{key:"progress",label:"Progress (%)",type:"number"},{key:"plagiarism_service",label:"Vakolatli tekshiruv xizmati"},{key:"plagiarism_check_date",label:"Tekshiruv sanasi",type:"date"},{key:"defense_readiness",label:"Himoyaga tayyorlik",type:"select",options:[{label:"Tayyor emas",value:"not_ready"},{label:"Ko‘rib chiqilmoqda",value:"review"},{label:"Tayyor",value:"ready"}]},{key:"final_file_name",label:"Yakuniy BMI fayli",type:"file"}
];

export const commissionFields:SmartField[]=[
  {key:"name",label:"Komissiya nomi",required:true},{key:"academic_year",label:"O‘quv yili",required:true},{key:"chairperson",label:"Rais"},{key:"members",label:"Komissiya a’zolari",type:"textarea"},{key:"schedule_start",label:"Boshlanish sanasi",type:"date"},{key:"schedule_end",label:"Yakun sanasi",type:"date"},{key:"location",label:"Manzil"},{key:"file_name",label:"Komissiya hujjati",type:"file"}
];

export const attestationFields:SmartField[]=[
  {key:"commission_id",label:"Komissiya ID",required:true},{key:"student_id",label:"Talaba ID",required:true},{key:"student_name",label:"Talaba F.I.Sh.",required:true},{key:"scheduled_at",label:"Attestatsiya sanasi",type:"date"},{key:"status",label:"Holat",type:"select",options:[{label:"Ruxsat etilgan",value:"eligible"},{label:"Rejalashtirilgan",value:"scheduled"},{label:"Yakunlangan",value:"completed"},{label:"Kelmagan",value:"absent"},{label:"Kechiktirilgan",value:"deferred"}]},{key:"evaluation_records",label:"Komissiya baholash qaydlari",type:"textarea"},{key:"final_result",label:"Yakuniy natija"}
];

export const assignmentFields:SmartField[]=[
  {key:"subject_id",label:"Fan ID",required:true},{key:"faculty_id",label:"Professor-o‘qituvchi ID",required:true},{key:"academic_group",label:"Akademik guruh",required:true},{key:"academic_year",label:"O‘quv yili",required:true},{key:"semester",label:"Semestr",type:"number"},{key:"schedule",label:"Dars jadvali",type:"textarea",placeholder:"Kun, vaqt va auditoriya"}
];

export const contentVersionFields:SmartField[]=[
  {key:"material_id",label:"Material ID",required:true},{key:"version",label:"Versiya",required:true},{key:"change_notes",label:"O‘zgarishlar izohi",type:"textarea"},{key:"file_name",label:"Versiya fayli",type:"file"}
];

export const internshipReportFields:SmartField[]=[
  {key:"internship_id",label:"Amaliyot ID",required:true},{key:"title",label:"Hisobot nomi",required:true},{key:"report_date",label:"Hisobot sanasi",type:"date",required:true},{key:"status",label:"Holat",type:"select",options:approvalOptions},{key:"feedback",label:"Rahbar fikri",type:"textarea"},{key:"file_name",label:"Hisobot fayli",type:"file"}
];

export const milestoneFields:SmartField[]=[
  {key:"thesis_id",label:"BMI ID",required:true},{key:"title",label:"Bosqich nomi",required:true},{key:"due_date",label:"Muddat",type:"date"},{key:"submitted_at",label:"Topshirilgan sana",type:"date"},{key:"status",label:"Holat",type:"select",options:[{label:"Reja",value:"planned"},{label:"Jarayonda",value:"in_progress"},{label:"Topshirilgan",value:"submitted"},{label:"Tasdiqlangan",value:"approved"},{label:"Tuzatish kerak",value:"revision_required"}]},{key:"reviewer_comments",label:"Taqrizchi izohi",type:"textarea"},{key:"file_name",label:"Bosqich hujjati",type:"file"}
];

export const publicationAuthorFields:SmartField[]=[
  {key:"publication_id",label:"Nashr ID",required:true},{key:"faculty_id",label:"Professor-o‘qituvchi ID"},{key:"author_name",label:"Muallif F.I.Sh.",required:true},{key:"author_order",label:"Muallif tartibi",type:"number"},{key:"is_corresponding",label:"Mas’ul muallif",type:"checkbox"}
];

export const publicationExternalIdFields:SmartField[]=[
  {key:"publication_id",label:"Nashr ID",required:true},{key:"provider",label:"Manba",type:"select",required:true,options:[{label:"DOI",value:"doi"},{label:"Scopus",value:"scopus"},{label:"Web of Science",value:"wos"},{label:"Crossref",value:"crossref"},{label:"ORCID",value:"orcid"},{label:"Boshqa",value:"other"}]},{key:"external_id",label:"Tashqi ID",required:true},{key:"verified_at",label:"Tekshirilgan sana",type:"date"}
];
